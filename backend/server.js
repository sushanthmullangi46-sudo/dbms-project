const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/database');
const errorHandler = require('./middleware/errorMiddleware');

// Route imports
const authRoutes = require('./routes/authRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const requestRoutes = require('./routes/requestRoutes');
const missionRoutes = require('./routes/missionRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const responderRoutes = require('./routes/responderRoutes');
const providerRoutes = require('./routes/providerRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');
const mapRoutes = require('./routes/mapRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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
        service: 'UDR-ORP Backend API',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/responder', responderRoutes);
app.use('/api/provider', providerRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/map', mapRoutes);

// Direct shortcut for audit logs as specified in requirements
const ReportController = require('./controllers/reportController');
const authenticateUser = require('./middleware/authMiddleware');
app.get('/api/audit-logs', authenticateUser, ReportController.getAuditLogs);

const path = require('path');
// Serve static frontend build if present
const frontendDist = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDist));

// SPA Wildcard Route: send index.html for any frontend navigation
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
        return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
});

// Centralized error handler
app.use(errorHandler);

// Server startup with Database Verification
async function startServer() {
    try {
        console.log('====================================================');
        console.log('URBAN DISASTER RESPONSE & RESOURCE ORCHESTRATION PLATFORM');
        console.log('Short Name: UDR-ORP Backend Service');
        console.log('====================================================');

        // Test connection pool
        try {
            await db.initializePool();
            const testRes = await db.execute('SELECT 1 AS HEALTH, SYSDATE FROM DUAL');
            console.log('[ORACLE DB] Verified live connection:', testRes.rows);
        } catch (dbErr) {
            console.warn('[ORACLE DB WARNING] Connection failed during startup check:', dbErr.message);
            console.warn('[ORACLE DB NOTE] Please run reset_oracle.bat to ensure Oracle XE is active and unlocked.');
        }

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`[HTTP SERVER] Running on:`);
            console.log(`  - Localhost: http://localhost:${PORT}`);
            console.log(`  - Direct IP: http://127.0.0.1:${PORT}`);
            console.log(`[ENDPOINTS] Health check available at http://localhost:${PORT}/health`);
        });
    } catch (err) {
        console.error('[FATAL SERVER ERROR]:', err);
        process.exit(1);
    }
}

// Graceful Shutdown
process.on('SIGINT', async () => {
    console.log('\n[SHUTDOWN] Interrupted by user. Closing database pools...');
    await db.closePool();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n[SHUTDOWN] Terminating process. Closing database pools...');
    await db.closePool();
    process.exit(0);
});

startServer();
