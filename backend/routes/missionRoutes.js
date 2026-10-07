const express = require('express');
const router = express.Router();
const MissionController = require('../controllers/missionController');
const authenticateUser = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/roleMiddleware');

router.use(authenticateUser);

router.get('/', MissionController.list);
router.get('/:id', MissionController.getById);

// Command Center only
router.post('/', authorizeRole('COMMAND_CENTER'), MissionController.create);
router.post('/:id/allocate', authorizeRole('COMMAND_CENTER'), MissionController.allocateResource);
router.put('/:id/status', authorizeRole(['COMMAND_CENTER', 'FIELD_RESPONDER']), MissionController.updateStatus);
router.put('/:id/complete', authorizeRole(['COMMAND_CENTER', 'FIELD_RESPONDER']), MissionController.complete);

module.exports = router;
