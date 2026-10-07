const express = require('express');
const router = express.Router();
const ResourceController = require('../controllers/resourceController');
const authenticateUser = require('../middleware/authMiddleware');

router.use(authenticateUser);

router.get('/', ResourceController.list);
router.get('/types', ResourceController.getTypes);
router.get('/vehicles', ResourceController.getVehicles);
router.get('/responders', ResourceController.getResponders);
router.get('/:id', ResourceController.getById);

module.exports = router;
