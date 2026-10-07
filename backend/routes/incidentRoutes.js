const express = require('express');
const router = express.Router();
const IncidentController = require('../controllers/incidentController');
const authenticateUser = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/roleMiddleware');

router.use(authenticateUser);

// All authenticated roles can list and view incident details
router.get('/', IncidentController.list);
router.get('/:id', IncidentController.getById);

// Only Command Center can create and update incidents
router.post('/', authorizeRole('COMMAND_CENTER'), IncidentController.create);
router.put('/:id', authorizeRole('COMMAND_CENTER'), IncidentController.update);

module.exports = router;
