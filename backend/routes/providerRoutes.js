const express = require('express');
const router = express.Router();
const ProviderController = require('../controllers/providerController');
const authenticateUser = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/roleMiddleware');

router.use(authenticateUser);
router.use(authorizeRole('RESOURCE_PROVIDER'));

router.get('/resources', ProviderController.getMyResources);
router.post('/resources', ProviderController.createResource);
router.put('/resources/:id', ProviderController.updateResource);
router.get('/allocations', ProviderController.getMyAllocations);
router.post('/handovers', ProviderController.recordHandover);

module.exports = router;
