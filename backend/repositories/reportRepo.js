const db = require('../config/database');

class ReportRepo {
    static async createReport(data, user) {
        const store = require('../config/memoryStore');
        const loc = store.locations.find(l => l.LOCATIONID === Number(data.location_id)) || store.locations[0];
        const newId = ++store.seq.report;
        const refSuffix = Math.floor(Math.random() * 900 + 100);
        const report = {
            report_id: newId,
            id: newId,
            report_reference_id: `RPT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-BN${refSuffix}`,
            disaster_type: data.disaster_type || 'Flood',
            severity_level: Number(data.trapped_persons || 0) > 0 || data.urgent_medical_needed ? 'CRITICAL' : Number(data.injuries_reported || 0) > 0 ? 'HIGH' : 'MODERATE',
            severity: Number(data.trapped_persons || 0) > 0 || data.urgent_medical_needed ? 'CRITICAL' : Number(data.injuries_reported || 0) > 0 ? 'HIGH' : 'MODERATE',
            location_id: loc.LOCATIONID,
            location_name: loc.LOCATIONNAME,
            ward_name: loc.ZONE || 'North Sector',
            description: data.description || 'Emergency incident reported by citizen',
            people_affected: Number(data.people_affected || 1),
            injuries_reported: Number(data.injuries_reported || 0),
            missing_persons: Number(data.missing_persons || 0),
            trapped_persons: Number(data.trapped_persons || 0),
            urgent_medical_needed: Boolean(data.urgent_medical_needed),
            evacuation_needed: Boolean(data.evacuation_needed),
            status: 'SUBMITTED',
            lat: loc.LATITUDE,
            lng: loc.LONGITUDE,
            latitude: loc.LATITUDE,
            longitude: loc.LONGITUDE,
            submitted_at: new Date().toISOString(),
            reporter_user_id: user?.userId || 1001,
            updates: []
        };
        store.citizenReports.unshift(report);
        return report;
    }

    static async listReports(filters = {}) {
        const store = require('../config/memoryStore');
        let reports = [...(store.citizenReports || [])];
        if (filters.status && filters.status !== 'ALL') {
            reports = reports.filter(r => r.status === filters.status);
        }
        if (filters.disaster_type) {
            reports = reports.filter(r => r.disaster_type.toLowerCase() === filters.disaster_type.toLowerCase());
        }
        return reports;
    }

    static async getReport(reportId) {
        let sql = '';
        const id = parseInt(reportId, 10);

        switch (id) {
            case 1:
                // Active Incidents with metrics
                sql = `
                    SELECT i.IncidentID, i.IncidentName, i.IncidentType, i.Severity,
                           l.LocationName, l.City, i.StartTime,
                           COUNT(DISTINCT r.RequestID) AS TotalRequests,
                           COUNT(DISTINCT m.MissionID) AS ActiveMissions,
                           CALCULATE_DISASTER_RISK_SCORE(i.IncidentID) AS CompositeRiskScore
                    FROM INCIDENTS i
                    JOIN LOCATIONS l ON i.LocationID = l.LocationID
                    LEFT JOIN REQUESTS r ON i.IncidentID = r.IncidentID
                    LEFT JOIN MISSIONS m ON r.RequestID = m.RequestID AND m.Status IN ('ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS')
                    WHERE i.Status = 'ACTIVE'
                    GROUP BY i.IncidentID, i.IncidentName, i.IncidentType, i.Severity, l.LocationName, l.City, i.StartTime
                    ORDER BY CompositeRiskScore DESC
                `;
                break;

            case 2:
                // Critical Emergency Requests
                sql = `
                    SELECT r.RequestID, r.RequestType, r.Priority, r.PeopleAffected,
                           r.Description, r.CreatedAt, i.IncidentName, l.LocationName,
                           u.FullName AS ContactPerson, u.Phone AS ContactPhone
                    FROM REQUESTS r
                    JOIN INCIDENTS i ON r.IncidentID = i.IncidentID
                    JOIN LOCATIONS l ON r.LocationID = l.LocationID
                    JOIN USERS u ON r.RequestedBy = u.UserID
                    WHERE r.Status IN ('PENDING', 'APPROVED') AND r.Priority IN ('CRITICAL', 'HIGH')
                    ORDER BY r.Priority DESC, r.PeopleAffected DESC
                `;
                break;

            case 3:
                // Most Requested Resources
                sql = `
                    SELECT rt.ResourceTypeID, rt.ResourceName, rt.Category, rt.Unit,
                           COUNT(ri.RequestItemID) AS FrequencyRequested,
                           SUM(ri.QuantityRequired) AS TotalUnitsRequested,
                           SUM(ri.QuantityAllocated) AS TotalUnitsAllocated,
                           ROUND((SUM(ri.QuantityAllocated) / NULLIF(SUM(ri.QuantityRequired), 0)) * 100, 2) AS FulfillmentRatePct
                    FROM RESOURCE_TYPES rt
                    JOIN REQUEST_ITEMS ri ON rt.ResourceTypeID = ri.ResourceTypeID
                    GROUP BY rt.ResourceTypeID, rt.ResourceName, rt.Category, rt.Unit
                    ORDER BY TotalUnitsRequested DESC
                `;
                break;

            case 4:
                // Resource Capacity & Utilization
                sql = `
                    SELECT rt.Category,
                           COUNT(r.ResourceID) AS AssetItemsCount,
                           SUM(r.Quantity) AS TotalStock,
                           SUM(CASE WHEN r.AvailabilityStatus = 'AVAILABLE' THEN r.Quantity ELSE 0 END) AS AvailableQty,
                           SUM(CASE WHEN r.AvailabilityStatus IN ('ALLOCATED', 'IN_USE') THEN r.Quantity ELSE 0 END) AS DeployedQty,
                           ROUND((SUM(CASE WHEN r.AvailabilityStatus IN ('ALLOCATED', 'IN_USE') THEN r.Quantity ELSE 0 END) / 
                                  NULLIF(SUM(r.Quantity), 0)) * 100, 2) AS UtilizationRatePct
                    FROM RESOURCE_TYPES rt
                    LEFT JOIN RESOURCES r ON rt.ResourceTypeID = r.ResourceTypeID
                    GROUP BY rt.Category
                    ORDER BY UtilizationRatePct DESC
                `;
                break;

            case 5:
                // Responder Workload
                sql = `
                    SELECT resp.ResponderID, resp.TeamName, resp.Specialization,
                           resp.ExperienceLevel, resp.CurrentStatus,
                           COUNT(m.MissionID) AS LifetimeMissions,
                           SUM(CASE WHEN m.Status IN ('ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS') THEN 1 ELSE 0 END) AS ActiveMissionsRunning
                    FROM RESPONDERS resp
                    LEFT JOIN MISSIONS m ON resp.ResponderID = m.ResponderID
                    GROUP BY resp.ResponderID, resp.TeamName, resp.Specialization, resp.ExperienceLevel, resp.CurrentStatus
                    ORDER BY ActiveMissionsRunning DESC, LifetimeMissions DESC
                `;
                break;

            case 6:
                // Average Response Time
                sql = `
                    SELECT i.Severity,
                           COUNT(m.MissionID) AS CompletedMissionsCount,
                           ROUND(AVG(CALCULATE_RESPONSE_TIME(m.MissionID)), 2) AS AvgResponseMinutes,
                           ROUND(MIN(CALCULATE_RESPONSE_TIME(m.MissionID)), 2) AS FastestResponseMinutes,
                           ROUND(MAX(CALCULATE_RESPONSE_TIME(m.MissionID)), 2) AS SlowestResponseMinutes
                    FROM INCIDENTS i
                    JOIN REQUESTS r ON i.IncidentID = r.IncidentID
                    JOIN MISSIONS m ON r.RequestID = m.RequestID
                    GROUP BY i.Severity
                    ORDER BY AvgResponseMinutes ASC
                `;
                break;

            case 7:
                // Inventory Shortage
                sql = `
                    SELECT w.WarehouseName, rt.ResourceName, rt.Category, rt.Unit,
                           inv.QuantityAvailable, inv.ReorderLevel,
                           (inv.ReorderLevel - inv.QuantityAvailable) AS ShortageUnits,
                           GET_INVENTORY_STATUS(inv.WarehouseID, inv.ResourceTypeID) AS ShortageSeverity
                    FROM INVENTORY inv
                    JOIN WAREHOUSES w ON inv.WarehouseID = w.WarehouseID
                    JOIN RESOURCE_TYPES rt ON inv.ResourceTypeID = rt.ResourceTypeID
                    WHERE inv.QuantityAvailable <= inv.ReorderLevel
                    ORDER BY inv.QuantityAvailable ASC
                `;
                break;

            case 8:
                // Mission Completion Statistics
                sql = `
                    SELECT m.Status AS MissionFinalStatus,
                           COUNT(m.MissionID) AS MissionCount,
                           ROUND(COUNT(m.MissionID) * 100.0 / (SELECT COUNT(*) FROM MISSIONS), 2) AS PercentageOfTotal
                    FROM MISSIONS m
                    GROUP BY m.Status
                    ORDER BY MissionCount DESC
                `;
                break;

            case 9:
                // Incident Resolution Summary
                sql = `
                    SELECT i.IncidentType,
                           COUNT(i.IncidentID) AS TotalIncidentsRecorded,
                           SUM(CASE WHEN i.Status = 'RESOLVED' OR i.Status = 'CLOSED' THEN 1 ELSE 0 END) AS ResolvedIncidents,
                           SUM(CASE WHEN i.Status = 'ACTIVE' THEN 1 ELSE 0 END) AS CurrentlyActiveIncidents,
                           ROUND(SUM(CASE WHEN i.Status IN ('RESOLVED', 'CLOSED') THEN 1 ELSE 0 END) * 100.0 / 
                                 NULLIF(COUNT(i.IncidentID), 0), 2) AS ResolutionRatePct
                    FROM INCIDENTS i
                    GROUP BY i.IncidentType
                    ORDER BY TotalIncidentsRecorded DESC
                `;
                break;

            case 10:
                // Resource Consumption Per Incident
                sql = `
                    SELECT i.IncidentID, i.IncidentName, i.IncidentType,
                           rt.ResourceName, rt.Category,
                           SUM(mr.QuantityAllocated) AS UnitsAllocated,
                           SUM(mr.QuantityUsed) AS UnitsConsumed,
                           SUM(mr.QuantityReturned) AS UnitsReturned
                    FROM INCIDENTS i
                    JOIN REQUESTS r ON i.IncidentID = r.IncidentID
                    JOIN MISSIONS m ON r.RequestID = m.RequestID
                    JOIN MISSION_RESOURCES mr ON m.MissionID = mr.MissionID
                    JOIN RESOURCES res ON mr.ResourceID = res.ResourceID
                    JOIN RESOURCE_TYPES rt ON res.ResourceTypeID = rt.ResourceTypeID
                    GROUP BY i.IncidentID, i.IncidentName, i.IncidentType, rt.ResourceName, rt.Category
                    ORDER BY UnitsConsumed DESC
                `;
                break;

            default:
                throw new Error(`Report ID ${reportId} not recognized.`);
        }

        const result = await db.execute(sql);
        return result.rows || [];
    }

    static async getAuditLogs({ incidentId, limit = 100, offset = 0 } = {}) {
        let whereSql = '';
        let binds = { offset: parseInt(offset, 10), limit: parseInt(limit, 10) };

        if (incidentId) {
            whereSql = 'WHERE il.IncidentID = :incidentId';
            binds.incidentId = Number(incidentId);
        }

        const sql = `
            SELECT il.LogID, il.IncidentID, i.IncidentName,
                   il.ActionType, il.Description, il.Timestamp, il.IPAddress,
                   NVL(u.FullName, 'System Automated') AS PerformedByName,
                   r.RoleName
            FROM INCIDENT_LOGS il
            JOIN INCIDENTS i ON il.IncidentID = i.IncidentID
            LEFT JOIN USERS u ON il.UserID = u.UserID
            LEFT JOIN ROLES r ON u.RoleID = r.RoleID
            ${whereSql}
            ORDER BY il.Timestamp DESC
            OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
        `;

        const result = await db.execute(sql, binds);
        return result.rows || [];
    }
}

module.exports = ReportRepo;
