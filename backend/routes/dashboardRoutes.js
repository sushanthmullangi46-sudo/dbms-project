const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboardController');
const authenticateUser = require('../middleware/authMiddleware');

router.use(authenticateUser);

router.get('/', DashboardController.getMetrics);

module.exports = router;
