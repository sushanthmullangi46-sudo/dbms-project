# PRODUCTION DEPLOYMENT & OPERATIONS GUIDE
## Urban Disaster Response & Relief Coordination Platform (UDRRMS / UDR-ORP)

---

## 1. Deployment Topology Overview

The repository supports local development, static frontend hosting with a separately deployed API, and a Node gateway deployment. Container and Linux examples below are starting points and require environment-specific configuration before production use.

```
[Static Frontend]
  Static Host -> HTTPS API Base URL -> FastAPI -> Persistent Database

[Strategy B: Enterprise Containerized]
  Docker Compose -> Nginx Reverse Proxy -> Node Gateway (:5000) -> FastAPI (:8000) -> Persistent DB

[Strategy C: Bare-Metal / Dedicated Linux Production]
  Systemd Managed Workers -> Gunicorn / Uvicorn Workers -> Oracle Database 19c Enterprise
```

---

## 2. Static Frontend Deployment

The repository includes an automated build pipeline deploying the compiled Single-Page Application (SPA) to GitHub Pages.

### Static frontend deployment
The frontend is static, but operational workflows require the FastAPI service and its database. There is no in-browser mock adapter: API requests fail visibly when the service cannot be reached. Deploy the API separately, configure `VITE_API_BASE_URL` to its `/api/v1` endpoint at build time, and configure the API CORS allowlist for the deployed site before publishing the frontend.

### Deployment Commands:
```bash
# 1. Build the frontend production bundle
npm --prefix frontend run build

# 2. Publish the built frontend to your static host
# Configure VITE_API_BASE_URL before this build and point it at a deployed API.
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
      - USE_SQLITE_DEV=true
      - DATABASE_FILE=/data/udrrms.db
      - JWT_SECRET=${JWT_SECRET}
      - CORS_ORIGINS=${CORS_ORIGINS}
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
Environment=USE_SQLITE_DEV=true
Environment=DATABASE_FILE=/opt/udrrms/database/udrrms.db
Environment=JWT_SECRET=<set-a-long-random-secret>
Environment=CORS_ORIGINS=https://your-frontend.example

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

