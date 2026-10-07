const db = require('../config/database');

class DashboardRepo {
    static async getMetrics() {
        // 1. Top KPI Summary Cards
        const topCardsSql = `
            SELECT 
                (SELECT COUNT(*) FROM INCIDENTS WHERE Status IN ('ACTIVE', 'ON_HOLD')) AS ACTIVE_INCIDENTS,
                (SELECT COUNT(*) FROM REQUESTS WHERE Status = 'PENDING') AS PENDING_REQUESTS,
                (SELECT COUNT(*) FROM MISSIONS WHERE Status IN ('ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS')) AS ACTIVE_MISSIONS,
                (SELECT COUNT(*) FROM RESPONDERS WHERE CurrentStatus = 'AVAILABLE') AS AVAILABLE_RESPONDERS,
                (SELECT COUNT(*) FROM VEHICLES WHERE Status = 'AVAILABLE') AS AVAILABLE_VEHICLES,
                (SELECT ROUND(NVL(SUM(CASE WHEN AvailabilityStatus IN ('ALLOCATED', 'IN_USE') THEN Quantity ELSE 0 END) * 100.0 / 
                              NULLIF(SUM(Quantity), 0), 0), 1) FROM RESOURCES) AS RESOURCE_UTILIZATION_PCT
            FROM DUAL
        `;
        const topCardsRes = await db.execute(topCardsSql);
        const topCards = topCardsRes.rows && topCardsRes.rows.length > 0 ? topCardsRes.rows[0] : {};

        // 2. Incident Severity Distribution
        const sevSql = `
            SELECT Severity AS "name", COUNT(*) AS "value"
            FROM INCIDENTS
            WHERE Status IN ('ACTIVE', 'ON_HOLD')
            GROUP BY Severity
            ORDER BY "value" DESC
        `;
        const sevRes = await db.execute(sevSql);

        // 3. Requests by Category
        const reqCatSql = `
            SELECT RequestType AS "name", COUNT(*) AS "value"
            FROM REQUESTS
            GROUP BY RequestType
            ORDER BY "value" DESC
        `;
        const reqCatRes = await db.execute(reqCatSql);

        // 4. Mission Status Breakdown
        const missStatSql = `
            SELECT Status AS "name", COUNT(*) AS "value"
            FROM MISSIONS
            GROUP BY Status
            ORDER BY "value" DESC
        `;
        const missStatRes = await db.execute(missStatSql);

        // 5. Resource Availability vs Allocation by Category
        const resAvailSql = `
            SELECT rt.Category AS "category",
                   NVL(SUM(CASE WHEN r.AvailabilityStatus = 'AVAILABLE' THEN r.Quantity ELSE 0 END), 0) AS "available",
                   NVL(SUM(CASE WHEN r.AvailabilityStatus IN ('ALLOCATED', 'IN_USE') THEN r.Quantity ELSE 0 END), 0) AS "deployed"
            FROM RESOURCE_TYPES rt
            LEFT JOIN RESOURCES r ON rt.ResourceTypeID = r.ResourceTypeID
            GROUP BY rt.Category
            ORDER BY rt.Category ASC
        `;
        const resAvailRes = await db.execute(resAvailSql);

        // 6. Inventory Alerts (Low & Critical items)
        const invAlertsSql = `
            SELECT inv.InventoryID, w.WarehouseName, rt.ResourceName,
                   inv.QuantityAvailable, inv.ReorderLevel,
                   CASE WHEN inv.QuantityAvailable = 0 THEN 'CRITICAL' ELSE 'LOW' END AS AlertLevel
            FROM INVENTORY inv
            JOIN WAREHOUSES w ON inv.WarehouseID = w.WarehouseID
            JOIN RESOURCE_TYPES rt ON inv.ResourceTypeID = rt.ResourceTypeID
            WHERE inv.QuantityAvailable <= inv.ReorderLevel
            FETCH FIRST 5 ROWS ONLY
        `;
        const invAlertsRes = await db.execute(invAlertsSql);

        // 7. Critical Requests Pending Attention
        const critReqSql = `
            SELECT r.RequestID, r.RequestType, r.Priority, r.PeopleAffected,
                   i.IncidentName, l.LocationName, r.CreatedAt
            FROM REQUESTS r
            JOIN INCIDENTS i ON r.IncidentID = i.IncidentID
            JOIN LOCATIONS l ON r.LocationID = l.LocationID
            WHERE r.Priority = 'CRITICAL' AND r.Status = 'PENDING'
            ORDER BY r.CreatedAt ASC
            FETCH FIRST 5 ROWS ONLY
        `;
        const critReqRes = await db.execute(critReqSql);

        // 8. Recent Audit Logs
        const recentLogsSql = `
            SELECT il.LogID, il.ActionType, il.Description, il.Timestamp, i.IncidentName
            FROM INCIDENT_LOGS il
            JOIN INCIDENTS i ON il.IncidentID = i.IncidentID
            ORDER BY il.Timestamp DESC
            FETCH FIRST 6 ROWS ONLY
        `;
        const recentLogsRes = await db.execute(recentLogsSql);

        return {
            topCards: {
                activeIncidents: topCards.ACTIVE_INCIDENTS || 0,
                pendingRequests: topCards.PENDING_REQUESTS || 0,
                activeMissions: topCards.ACTIVE_MISSIONS || 0,
                availableResponders: topCards.AVAILABLE_RESPONDERS || 0,
                availableVehicles: topCards.AVAILABLE_VEHICLES || 0,
                resourceUtilizationPct: topCards.RESOURCE_UTILIZATION_PCT || 0
            },
            severityDistribution: sevRes.rows || [],
            requestsByCategory: reqCatRes.rows || [],
            missionStatusDistribution: missStatRes.rows || [],
            resourceAvailabilityByCategory: resAvailRes.rows || [],
            inventoryAlerts: invAlertsRes.rows || [],
            criticalPendingRequests: critReqRes.rows || [],
            recentActivity: recentLogsRes.rows || []
        };
    }
}

module.exports = DashboardRepo;
