# PRODUCTION DEPLOYMENT & OPERATIONS GUIDE
## Urban Disaster Response & Relief Coordination Platform (UDRRMS / UDR-ORP)

---

## 1. Deployment Topology Overview

The UDRRMS platform supports three distinct deployment modes depending on organizational infrastructure and operational readiness:

```
[Strategy A: Standalone Cloud Demo]
  GitHub Pages (gh-pages branch) -> In-Browser Storage Adapter -> Zero-Backend Host

[Strategy B: Enterprise Containerized]
  Docker Compose -> Nginx Reverse Proxy -> Node Gateway (:5000) -> FastAPI (:8000) -> Persistent DB

[Strategy C: Bare-Metal / Dedicated Linux Production]
  Systemd Managed Workers -> Gunicorn / Uvicorn Workers -> Oracle Database 19c Enterprise
```

---

## 2. Strategy A: GitHub Pages Live Demo Deployment

The repository includes an automated build pipeline deploying the compiled Single-Page Application (SPA) to GitHub Pages.

### Live Demo URL:
**[https://sushanthmullangi46-sudo.github.io/dbms-project/](https://sushanthmullangi46-sudo.github.io/dbms-project/)**

### Standalone Fallback Architecture:
When running on static cloud hosting without a connected Python engine, the client Axios adapter activates [`frontend/src/api/client.js`](file:///c:/Users/mdpul/OneDrive/Desktop/DBMS%20PROJECT/frontend/src/api/client.js) fallback resolution:
- Intercepts outbound `/api/v1` calls in-browser.
- Returns comprehensive 3NF relational schemas for all 4 roles.
- Supports report submissions, verification transitions, and stock reservations in local storage.

### Deployment Commands:
```bash
# 1. Build the frontend production bundle
npm --prefix frontend run build

# 2. Deploy dist directory to gh-pages branch
git checkout gh-pages
# Copy built dist files to root, commit, and push:
git add .
git commit -m "deploy: update live production build"
git push origin gh-pages
git checkout main
```

---

## 3. Strategy B: Enterprise Docker Container Deployment

### Dockerfile (`backend_py/Dockerfile`):
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### Docker Compose (`docker-compose.yml`):
```yaml
version: '3.8'

services:
  udr-backend:
    build:
      context: ./backend_py
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=sqlite:////data/udrrms.db
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
    volumes:
      - udr-data:/data
    restart: always

  udr-gateway:
    build:
      context: .
      dockerfile: Dockerfile.gateway
    ports:
      - "5000:5000"
    environment:
      - BACKEND_PY_URL=http://udr-backend:8000
    depends_on:
      - udr-backend
    restart: always

volumes:
  udr-data:
```

### Launch Container Cluster:
```bash
docker-compose up -d --build
```

---

## 4. Strategy C: Production Linux Server (Ubuntu 22.04 LTS)

### 4.1 Systemd Service Unit (`/etc/systemd/system/udrrms-backend.service`):
```ini
[Unit]
Description=UDRRMS FastAPI Enterprise Backend Service
After=network.target

[Service]
User=udrrms
WorkingDirectory=/opt/udrrms/backend_py
ExecStart=/opt/udrrms/venv/bin/gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 127.0.0.1:8000
Restart=always
RestartSec=5
Environment=DATABASE_URL=sqlite:////opt/udrrms/database/udrrms.db
Environment=JWT_SECRET_KEY=production_vault_secret_key_2026

[Install]
WantedBy=multi-user.target
```

### 4.2 Nginx Production Gateway Configuration (`/etc/nginx/sites-available/udrrms`):
```nginx
server {
    listen 80;
    server_name disaster.karnataka.gov.in;

    # Static Frontend SPA
    location / {
        root /opt/udrrms/frontend/dist;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }

    # API Reverse Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 5. Database Backup & Disaster Recovery Routine

### 5.1 Automated Nightly Backup Cron:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/udrrms"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

# Safe SQLite Backup using online backup API
sqlite3 /opt/udrrms/database/udrrms.db ".backup '$BACKUP_DIR/udrrms_backup_$TIMESTAMP.db'"
gzip "$BACKUP_DIR/udrrms_backup_$TIMESTAMP.db"

# Retain 30 days of archives
find "$BACKUP_DIR" -type f -mtime +30 -name "*.db.gz" -delete
```

### 5.2 Restore Verification:
```bash
# Decompress and verify database integrity
gunzip -c /var/backups/udrrms/udrrms_backup_20261110.db.gz > /tmp/restore_test.db
sqlite3 /tmp/restore_test.db "PRAGMA integrity_check;"
# Output: ok
```
