const express = require('express');
const router = express.Router();
const InventoryController = require('../controllers/inventoryController');
const authenticateUser = require('../middleware/authMiddleware');

router.use(authenticateUser);

router.get('/stock', InventoryController.getStock);
router.get('/warehouses', InventoryController.getWarehouses);
router.get('/shelters', InventoryController.getShelters);
router.get('/transactions', InventoryController.getTransactions);

module.exports = router;
