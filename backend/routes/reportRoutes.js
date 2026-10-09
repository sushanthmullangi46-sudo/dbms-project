const express = require('express');
const router = express.Router();
const ReportController = require('../controllers/reportController');

// List reports and submit report are accessible across portal sessions
router.get('/', ReportController.listReports);
router.post('/', ReportController.createReport);

router.get('/audit-logs', ReportController.getAuditLogs);
router.get('/:reportId', ReportController.getReport);

module.exports = router;
