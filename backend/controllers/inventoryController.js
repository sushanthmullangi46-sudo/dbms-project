const InventoryRepo = require('../repositories/inventoryRepo');

class InventoryController {
    static async getStock(req, res, next) {
        try {
            const { warehouseId, stockStatus, search } = req.query;
            const inventory = await InventoryRepo.getInventoryStatus({ warehouseId, stockStatus, search });
            return res.json({ success: true, count: inventory.length, inventory });
        } catch (err) {
            next(err);
        }
    }

    static async getWarehouses(req, res, next) {
        try {
            const warehouses = await InventoryRepo.getWarehouses();
            return res.json({ success: true, count: warehouses.length, warehouses });
        } catch (err) {
            next(err);
        }
    }

    static async getShelters(req, res, next) {
        try {
            const shelters = await InventoryRepo.getShelters();
            return res.json({ success: true, count: shelters.length, shelters });
        } catch (err) {
            next(err);
        }
    }

    static async getTransactions(req, res, next) {
        try {
            const { warehouseId, limit, offset } = req.query;
            const transactions = await InventoryRepo.getTransactions({ warehouseId, limit, offset });
            return res.json({ success: true, count: transactions.length, transactions });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = InventoryController;
