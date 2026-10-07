const express = require('express');
const router = express.Router();
const MapController = require('../controllers/mapController');
const authenticateUser = require('../middleware/authMiddleware');

router.use(authenticateUser);

router.get('/markers', MapController.getMarkers);

module.exports = router;
