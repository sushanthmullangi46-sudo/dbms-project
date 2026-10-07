const db = require('../config/database');
const oracledb = require('oracledb');

class RequestRepo {
    static async getAll({ status, priority, incidentId, requestType, limit = 50, offset = 0 } = {}) {
        let whereClauses = [];
        let binds = {};

        if (status) {
            whereClauses.push("r.Status = :status");
            binds.status = status;
        }
        if (priority) {
            whereClauses.push("r.Priority = :priority");
            binds.priority = priority;
        }
        if (incidentId) {
            whereClauses.push("r.IncidentID = :incidentId");
            binds.incidentId = Number(incidentId);
        }
        if (requestType) {
            whereClauses.push("r.RequestType = :requestType");
            binds.requestType = requestType;
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const sql = `
            SELECT r.RequestID, r.IncidentID, i.IncidentName, i.Severity AS IncidentSeverity,
                   r.LocationID, l.LocationName, l.Address, l.Latitude, l.Longitude,
                   r.RequestedBy, u.FullName AS RequestedByName, u.Phone AS RequesterPhone,
                   r.RequestType, r.Priority, r.PeopleAffected, r.Description,
                   r.Status, r.CreatedAt, r.ResolvedAt,
                   COUNT(DISTINCT m.MissionID) AS LinkedMissionCount
            FROM REQUESTS r
            JOIN INCIDENTS i ON r.IncidentID = i.IncidentID
            JOIN LOCATIONS l ON r.LocationID = l.LocationID
            JOIN USERS u ON r.RequestedBy = u.UserID
            LEFT JOIN MISSIONS m ON r.RequestID = m.RequestID
            ${whereSql}
            GROUP BY r.RequestID, r.IncidentID, i.IncidentName, i.Severity,
                     r.LocationID, l.LocationName, l.Address, l.Latitude, l.Longitude,
                     r.RequestedBy, u.FullName, u.Phone,
                     r.RequestType, r.Priority, r.PeopleAffected, r.Description,
                     r.Status, r.CreatedAt, r.ResolvedAt
            ORDER BY 
                CASE r.Priority 
                    WHEN 'CRITICAL' THEN 1 
                    WHEN 'HIGH' THEN 2 
                    WHEN 'MEDIUM' THEN 3 
                    ELSE 4 
                END ASC,
                r.CreatedAt DESC
            OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
        `;

        binds.offset = parseInt(offset, 10);
        binds.limit = parseInt(limit, 10);

        const result = await db.execute(sql, binds);
        return result.rows || [];
    }

    static async getById(requestId) {
        const sql = `
            SELECT r.RequestID, r.IncidentID, i.IncidentName, i.Severity AS IncidentSeverity,
                   r.LocationID, l.LocationName, l.Address, l.Latitude, l.Longitude,
                   r.RequestedBy, u.FullName AS RequestedByName, u.Phone AS RequesterPhone,
                   r.RequestType, r.Priority, r.PeopleAffected, r.Description,
                   r.Status, r.CreatedAt, r.ResolvedAt
            FROM REQUESTS r
            JOIN INCIDENTS i ON r.IncidentID = i.IncidentID
            JOIN LOCATIONS l ON r.LocationID = l.LocationID
            JOIN USERS u ON r.RequestedBy = u.UserID
            WHERE r.RequestID = :requestId
        `;

        const result = await db.execute(sql, { requestId: Number(requestId) });
        if (!result.rows || result.rows.length === 0) return null;

        const request = result.rows[0];

        // Fetch request items
        const itemsSql = `
            SELECT ri.RequestItemID, ri.ResourceTypeID, rt.ResourceName, rt.Category,
                   ri.QuantityRequired, ri.QuantityAllocated, ri.Unit
            FROM REQUEST_ITEMS ri
            JOIN RESOURCE_TYPES rt ON ri.ResourceTypeID = rt.ResourceTypeID
            WHERE ri.RequestID = :requestId
        `;
        const itemsRes = await db.execute(itemsSql, { requestId: Number(requestId) });
        request.items = itemsRes.rows || [];

        // Fetch linked missions
        const missionsSql = `
            SELECT m.MissionID, m.Status, m.Priority, m.StartTime,
                   resp.TeamName, v.VehicleType, v.RegistrationNumber
            FROM MISSIONS m
            JOIN RESPONDERS resp ON m.ResponderID = resp.ResponderID
            LEFT JOIN VEHICLES v ON m.VehicleID = v.VehicleID
            WHERE m.RequestID = :requestId
        `;
        const missRes = await db.execute(missionsSql, { requestId: Number(requestId) });
        request.missions = missRes.rows || [];

        return request;
    }

    /**
     * Invoke Oracle Stored Procedure: CREATE_REQUEST
     */
    static async create({ incidentId, locationId, requestedBy, requestType, priority, peopleAffected, description, items = [] }) {
        let requestId;

        await db.executeTransaction(async (conn) => {
            const procSql = `
                BEGIN
                    CREATE_REQUEST(
                        p_incident_id => :incidentId,
                        p_location_id => :locationId,
                        p_requested_by => :requestedBy,
                        p_type => :requestType,
                        p_priority => :priority,
                        p_people_aff => :peopleAffected,
                        p_desc => :description,
                        p_request_id => :requestId
                    );
                END;
            `;

            const binds = {
                incidentId: Number(incidentId),
                locationId: Number(locationId),
                requestedBy: Number(requestedBy),
                requestType,
                priority,
                peopleAffected: Number(peopleAffected || 1),
                description,
                requestId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
            };

            const procRes = await conn.execute(procSql, binds);
            requestId = procRes.outBinds.requestId;

            // Insert request items if provided
            if (Array.isArray(items) && items.length > 0) {
                const itemSql = `
                    INSERT INTO REQUEST_ITEMS (
                        RequestItemID, RequestID, ResourceTypeID, QuantityRequired, QuantityAllocated, Unit
                    ) VALUES (
                        SEQ_REQUEST_ITEMS.NEXTVAL, :requestId, :resourceTypeId, :quantityRequired, 0, :unit
                    )
                `;
                for (const it of items) {
                    await conn.execute(itemSql, {
                        requestId,
                        resourceTypeId: Number(it.resourceTypeId),
                        quantityRequired: Number(it.quantityRequired),
                        unit: it.unit || 'Units'
                    });
                }
            }
        });

        return requestId;
    }

    static async updateStatus(requestId, status) {
        const sql = `
            UPDATE REQUESTS
            SET Status = :status,
                ResolvedAt = CASE WHEN :status = 'RESOLVED' THEN CURRENT_TIMESTAMP ELSE ResolvedAt END
            WHERE RequestID = :requestId
        `;
        await db.execute(sql, { status, requestId: Number(requestId) });
    }
}

module.exports = RequestRepo;
