const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/reportController');
const authenticateUser = require('../middleware/authMiddleware');

router.use(authenticateUser);

router.get('/audit-logs', ReportController.getAuditLogs);
router.get('/:reportId', ReportController.getReport);

module.exports = router;
