const express = require('express');
const router = express.Router();
const RequestController = require('../controllers/requestController');
const authenticateUser = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/roleMiddleware');

router.use(authenticateUser);

router.get('/', RequestController.list);
router.get('/:id', RequestController.getById);

// Command Center and authorized officers can create requests
router.post('/', authorizeRole(['COMMAND_CENTER', 'FIELD_RESPONDER']), RequestController.create);
router.put('/:id/status', authorizeRole('COMMAND_CENTER'), RequestController.updateStatus);

module.exports = router;
