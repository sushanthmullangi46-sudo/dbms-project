const db = require('../config/database');

class InventoryRepo {
    static async getInventoryStatus({ warehouseId, stockStatus, search } = {}) {
        let whereClauses = [];
        let binds = {};

        if (warehouseId) {
            whereClauses.push("WarehouseID = :warehouseId");
            binds.warehouseId = Number(warehouseId);
        }
        if (stockStatus) {
            whereClauses.push("StockStatus = :stockStatus");
            binds.stockStatus = stockStatus;
        }
        if (search) {
            whereClauses.push("(LOWER(ResourceName) LIKE :search OR LOWER(WarehouseName) LIKE :search OR LOWER(Category) LIKE :search)");
            binds.search = `%${search.toLowerCase()}%`;
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const sql = `
            SELECT InventoryID, WarehouseID, WarehouseName, WarehouseLocation,
                   ResourceTypeID, ResourceName, Category, Unit,
                   QuantityAvailable, ReorderLevel, StockStatus, LastUpdated
            FROM V_INVENTORY_STATUS
            ${whereSql}
            ORDER BY 
                CASE StockStatus 
                    WHEN 'CRITICAL' THEN 1 
                    WHEN 'LOW' THEN 2 
                    ELSE 3 
                END ASC,
                QuantityAvailable ASC
        `;

        const result = await db.execute(sql, binds);
        return result.rows || [];
    }

    static async getWarehouses() {
        const sql = `
            SELECT w.WarehouseID, w.WarehouseName, w.Capacity, w.ManagerName, w.Status,
                   l.LocationID, l.LocationName, l.Address, l.City, l.Latitude, l.Longitude,
                   COUNT(inv.InventoryID) AS StockItemCount,
                   NVL(SUM(inv.QuantityAvailable), 0) AS TotalUnitsStocked
            FROM WAREHOUSES w
            JOIN LOCATIONS l ON w.LocationID = l.LocationID
            LEFT JOIN INVENTORY inv ON w.WarehouseID = inv.WarehouseID
            GROUP BY w.WarehouseID, w.WarehouseName, w.Capacity, w.ManagerName, w.Status,
                     l.LocationID, l.LocationName, l.Address, l.City, l.Latitude, l.Longitude
            ORDER BY w.WarehouseID ASC
        `;
        const result = await db.execute(sql);
        return result.rows || [];
    }

    static async getShelters() {
        const sql = `
            SELECT s.ShelterID, s.ShelterName, s.Capacity, s.CurrentOccupancy,
                   s.MedicalFacility, s.WaterAvailable, s.Status,
                   (s.Capacity - s.CurrentOccupancy) AS RemainingCapacity,
                   ROUND((s.CurrentOccupancy / s.Capacity) * 100, 1) AS OccupancyRate,
                   l.LocationID, l.LocationName, l.Address, l.City, l.Latitude, l.Longitude
            FROM SHELTERS s
            JOIN LOCATIONS l ON s.LocationID = l.LocationID
            ORDER BY s.ShelterID ASC
        `;
        const result = await db.execute(sql);
        return result.rows || [];
    }

    static async getTransactions({ warehouseId, limit = 50, offset = 0 } = {}) {
        let whereSql = '';
        let binds = { offset: parseInt(offset, 10), limit: parseInt(limit, 10) };

        if (warehouseId) {
            whereSql = 'WHERE it.WarehouseID = :warehouseId';
            binds.warehouseId = Number(warehouseId);
        }

        const sql = `
            SELECT it.TransactionID, it.TransactionType, it.Quantity, it.TransactionTime, it.Notes,
                   w.WarehouseName,
                   rt.ResourceName, rt.Category, rt.Unit,
                   m.MissionID,
                   u.FullName AS PerformedByName
            FROM INVENTORY_TRANSACTIONS it
            JOIN WAREHOUSES w ON it.WarehouseID = w.WarehouseID
            JOIN RESOURCE_TYPES rt ON it.ResourceTypeID = rt.ResourceTypeID
            JOIN USERS u ON it.PerformedBy = u.UserID
            LEFT JOIN MISSIONS m ON it.MissionID = m.MissionID
            ${whereSql}
            ORDER BY it.TransactionTime DESC
            OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
        `;

        const result = await db.execute(sql, binds);
        return result.rows || [];
    }
}

module.exports = InventoryRepo;
