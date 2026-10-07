const express = require('express');
const router = express.Router();
const ResponderController = require('../controllers/responderController');
const authenticateUser = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/roleMiddleware');

router.use(authenticateUser);
router.use(authorizeRole('FIELD_RESPONDER'));

router.get('/missions', ResponderController.getMyMissions);
router.get('/missions/:id', ResponderController.getMissionById);
router.put('/missions/:id/status', ResponderController.updateStatus);
router.post('/missions/:id/report', ResponderController.submitReport);
router.post('/missions/:id/complete', ResponderController.completeMission);

module.exports = router;
