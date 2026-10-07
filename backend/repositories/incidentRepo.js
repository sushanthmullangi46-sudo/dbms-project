const db = require('../config/database');
const oracledb = require('oracledb');

class IncidentRepo {
    static async getAll({ status, severity, search, limit = 50, offset = 0 } = {}) {
        let whereClauses = [];
        let binds = {};

        if (status) {
            whereClauses.push("i.Status = :status");
            binds.status = status;
        }
        if (severity) {
            whereClauses.push("i.Severity = :severity");
            binds.severity = severity;
        }
        if (search) {
            whereClauses.push("(LOWER(i.IncidentName) LIKE :search OR LOWER(l.LocationName) LIKE :search OR LOWER(i.IncidentType) LIKE :search)");
            binds.search = `%${search.toLowerCase()}%`;
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const sql = `
            SELECT i.IncidentID, i.IncidentName, i.IncidentType, i.Severity, i.Status,
                   i.StartTime, i.EndTime, i.Description,
                   l.LocationID, l.LocationName, l.Address, l.City, l.Latitude, l.Longitude, l.RiskZone,
                   u.FullName AS CreatedByName,
                   COUNT(DISTINCT r.RequestID) AS RequestCount,
                   COUNT(DISTINCT m.MissionID) AS MissionCount
            FROM INCIDENTS i
            JOIN LOCATIONS l ON i.LocationID = l.LocationID
            JOIN USERS u ON i.CreatedBy = u.UserID
            LEFT JOIN REQUESTS r ON i.IncidentID = r.IncidentID
            LEFT JOIN MISSIONS m ON r.RequestID = m.RequestID
            ${whereSql}
            GROUP BY i.IncidentID, i.IncidentName, i.IncidentType, i.Severity, i.Status,
                     i.StartTime, i.EndTime, i.Description,
                     l.LocationID, l.LocationName, l.Address, l.City, l.Latitude, l.Longitude, l.RiskZone,
                     u.FullName
            ORDER BY i.StartTime DESC
            OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
        `;

        binds.offset = parseInt(offset, 10);
        binds.limit = parseInt(limit, 10);

        const result = await db.execute(sql, binds);
        return result.rows || [];
    }

    static async getById(incidentId) {
        const sql = `
            SELECT i.IncidentID, i.IncidentName, i.IncidentType, i.Severity, i.Status,
                   i.StartTime, i.EndTime, i.Description, i.CreatedAt,
                   l.LocationID, l.LocationName, l.Address, l.City, l.Latitude, l.Longitude, l.RiskZone,
                   u.FullName AS CreatedByName, u.Email AS CreatedByEmail
            FROM INCIDENTS i
            JOIN LOCATIONS l ON i.LocationID = l.LocationID
            JOIN USERS u ON i.CreatedBy = u.UserID
            WHERE i.IncidentID = :incidentId
        `;
        const result = await db.execute(sql, { incidentId });
        if (!result.rows || result.rows.length === 0) return null;

        const incident = result.rows[0];

        // Fetch affected zones
        const zonesSql = `
            SELECT iz.LocationID, l.LocationName, l.Latitude, l.Longitude,
                   iz.Severity, iz.PopulationAffected, iz.Notes
            FROM INCIDENT_ZONES iz
            JOIN LOCATIONS l ON iz.LocationID = l.LocationID
            WHERE iz.IncidentID = :incidentId
        `;
        const zonesRes = await db.execute(zonesSql, { incidentId });
        incident.zones = zonesRes.rows || [];

        // Fetch emergency requests
        const requestsSql = `
            SELECT r.RequestID, r.RequestType, r.Priority, r.PeopleAffected, 
                   r.Status, r.Description, r.CreatedAt,
                   l.LocationName, u.FullName AS RequestedByName
            FROM REQUESTS r
            JOIN LOCATIONS l ON r.LocationID = l.LocationID
            JOIN USERS u ON r.RequestedBy = u.UserID
            WHERE r.IncidentID = :incidentId
            ORDER BY r.CreatedAt DESC
        `;
        const reqRes = await db.execute(requestsSql, { incidentId });
        incident.requests = reqRes.rows || [];

        // Fetch missions
        const missionsSql = `
            SELECT m.MissionID, m.Status, m.Priority, m.StartTime, m.ExpectedEndTime,
                   resp.TeamName, v.VehicleType, v.RegistrationNumber
            FROM MISSIONS m
            JOIN REQUESTS r ON m.RequestID = r.RequestID
            JOIN RESPONDERS resp ON m.ResponderID = resp.ResponderID
            LEFT JOIN VEHICLES v ON m.VehicleID = v.VehicleID
            WHERE r.IncidentID = :incidentId
            ORDER BY m.StartTime DESC
        `;
        const missRes = await db.execute(missionsSql, { incidentId });
        incident.missions = missRes.rows || [];

        // Fetch field reports
        const reportsSql = `
            SELECT fr.ReportID, fr.ReportType, fr.Severity, fr.Description, fr.CreatedAt,
                   resp.TeamName, l.LocationName
            FROM FIELD_REPORTS fr
            JOIN MISSIONS m ON fr.MissionID = m.MissionID
            JOIN REQUESTS r ON m.RequestID = r.RequestID
            JOIN RESPONDERS resp ON fr.ResponderID = resp.ResponderID
            JOIN LOCATIONS l ON fr.LocationID = l.LocationID
            WHERE r.IncidentID = :incidentId
            ORDER BY fr.CreatedAt DESC
        `;
        const repRes = await db.execute(reportsSql, { incidentId });
        incident.fieldReports = repRes.rows || [];

        // Fetch audit logs
        const logsSql = `
            SELECT il.LogID, il.ActionType, il.Description, il.Timestamp,
                   NVL(u.FullName, 'System Automated') AS PerformedByName
            FROM INCIDENT_LOGS il
            LEFT JOIN USERS u ON il.UserID = u.UserID
            WHERE il.IncidentID = :incidentId
            ORDER BY il.Timestamp DESC
        `;
        const logRes = await db.execute(logsSql, { incidentId });
        incident.auditLogs = logRes.rows || [];

        return incident;
    }

    /**
     * Invoke Oracle Stored Procedure: CREATE_INCIDENT
     */
    static async create({ incidentName, incidentType, severity, locationId, description, createdBy }) {
        const sql = `
            BEGIN
                CREATE_INCIDENT(
                    p_name => :incidentName,
                    p_type => :incidentType,
                    p_severity => :severity,
                    p_location_id => :locationId,
                    p_description => :description,
                    p_created_by => :createdBy,
                    p_incident_id => :incidentId
                );
            END;
        `;

        const binds = {
            incidentName,
            incidentType,
            severity,
            locationId: Number(locationId),
            description,
            createdBy: Number(createdBy),
            incidentId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        };

        const result = await db.execute(sql, binds);
        return result.outBinds.incidentId;
    }

    static async update(incidentId, { incidentName, status, severity, description, endTime, userId }) {
        let setClauses = [];
        let binds = { incidentId: Number(incidentId) };

        if (incidentName) {
            setClauses.push("IncidentName = :incidentName");
            binds.incidentName = incidentName;
        }
        if (status) {
            setClauses.push("Status = :status");
            binds.status = status;
            if (status === 'RESOLVED' || status === 'CLOSED') {
                setClauses.push("EndTime = CURRENT_TIMESTAMP");
            }
        }
        if (severity) {
            setClauses.push("Severity = :severity");
            binds.severity = severity;
        }
        if (description) {
            setClauses.push("Description = :description");
            binds.description = description;
        }

        if (setClauses.length === 0) return;

        const sql = `
            UPDATE INCIDENTS
            SET ${setClauses.join(', ')}
            WHERE IncidentID = :incidentId
        `;

        await db.execute(sql, binds);
    }
}

module.exports = IncidentRepo;
