const express = require('express');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');
require('dotenv').config();

const errorHandler = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;
let pyProcess = null;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'UP',
        service: 'UDR-ORP Unified Gateway Service',
        database: 'Permanent SQLite Engine (27 Tables)',
        timestamp: new Date().toISOString()
    });
});

// Auto-spawn or connect to Python FastAPI Database Engine
async function ensurePythonBackend() {
    const pythonBase = process.env.BACKEND_PY_URL || process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000';
    try {
        const ping = await fetch(`${pythonBase}/health`, { signal: AbortSignal.timeout(1500) });
        if (ping.ok) {
            console.log(`[PYTHON ENGINE] Verified live backend on ${pythonBase}`);
            return;
        }
    } catch (_) {}

    console.log(`[PYTHON ENGINE] Spawning FastAPI database engine on port 8000...`);
    const pyCwd = path.join(__dirname, '../backend_py');
    pyProcess = spawn('python', ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'], {
        cwd: pyCwd,
        stdio: 'inherit',
        shell: true
    });

    for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 600));
        try {
            const check = await fetch(`${pythonBase}/health`, { signal: AbortSignal.timeout(1000) });
            if (check.ok) {
                console.log(`[PYTHON ENGINE] FastAPI database engine operational on ${pythonBase}!`);
                break;
            }
        } catch (_) {}
    }
}

// Proxy all /api and /api/v1 calls to the persistent FastAPI service
const handleApiProxy = async (req, res, next) => {
    const pythonBase = process.env.BACKEND_PY_URL || process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000';
    try {
        let subPath = req.originalUrl;
        if (!subPath.startsWith('/api/v1') && subPath.startsWith('/api')) {
            subPath = subPath.replace(/^\/api/, '/api/v1');
        }

        const targetUrl = new URL(subPath, pythonBase);
        const forwardHeaders = {};
        for (const [key, val] of Object.entries(req.headers)) {
            const k = key.toLowerCase();
            if (['host', 'content-length', 'expect', 'connection', 'transfer-encoding', 'keep-alive'].includes(k)) {
                continue;
            }
            forwardHeaders[k] = val;
        }
        if (!forwardHeaders['content-type']) {
            forwardHeaders['content-type'] = 'application/json';
        }

        let bodyPayload = null;
        if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
            if (typeof req.body === 'string') {
                bodyPayload = req.body;
            } else if (typeof req.body === 'object') {
                const keys = Object.keys(req.body);
                if (keys.length === 1 && keys[0].startsWith('{') && req.body[keys[0]] === '') {
                    bodyPayload = keys[0];
                } else if (keys.length > 0) {
                    bodyPayload = JSON.stringify(req.body);
                }
            }
        }

        const fetchOptions = {
            method: req.method,
            headers: forwardHeaders
        };
        if (bodyPayload) {
            fetchOptions.body = bodyPayload;
        }

        const pyRes = await fetch(targetUrl, fetchOptions);
        res.status(pyRes.status);
        pyRes.headers.forEach((val, key) => {
            if (key !== 'content-encoding' && key !== 'transfer-encoding') {
                res.setHeader(key, val);
            }
        });

        const data = await pyRes.arrayBuffer();
        return res.send(Buffer.from(data));
    } catch (err) {
        console.error(`[API GATEWAY ERROR] Failed to forward request to ${pythonBase}:`, err);
        return res.status(503).json({
            success: false,
            message: 'Database backend service is starting up. Please retry in a moment.',
            detail: err.message
        });
    }
};

app.use(['/api', '/docs', '/openapi.json', '/redoc'], handleApiProxy);

// Serve static frontend build if present
const frontendDist = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));

// SPA Wildcard Route: send index.html for any frontend navigation
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health') || req.path.startsWith('/docs') || req.path.startsWith('/openapi.json') || req.path.startsWith('/redoc')) {
        return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'), (err) => {
        if (err && !res.headersSent) {
            next(err);
        }
    });
});

// Centralized error handler
app.use(errorHandler);

// Server startup
async function startServer() {
    try {
        console.log('====================================================');
        console.log('URBAN DISASTER RESPONSE & RESOURCE ORCHESTRATION PLATFORM');
        console.log('Short Name: UDR-ORP Unified Gateway Service');
        console.log('Database: Permanent Relational SQLite (database/udrrms.db)');
        console.log('====================================================');

        await ensurePythonBackend();

        const server = app.listen(PORT, () => {
            console.log(`[HTTP SERVER] Running on:`);
            console.log(`  - Localhost: http://localhost:${PORT}`);
            console.log(`  - Direct IP: http://127.0.0.1:${PORT}`);
            console.log(`[ENDPOINTS] Health check available at http://localhost:${PORT}/health`);
        });

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`[PORT CONFLICT] Port ${PORT} in use, retrying in 1s...`);
                setTimeout(() => {
                    server.close();
                    server.listen(PORT);
                }, 1000);
            } else {
                console.error('[HTTP SERVER ERROR]:', err);
            }
        });
    } catch (err) {
        console.error('[FATAL SERVER ERROR]:', err);
        process.exit(1);
    }
}

// Graceful Shutdown
function cleanExit() {
    if (pyProcess) {
        try {
            console.log('\n[SHUTDOWN] Terminating Python database process...');
            pyProcess.kill();
        } catch (_) {}
    }
    process.exit(0);
}

process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);

if (require.main === module) {
    startServer();
}

module.exports = app;
