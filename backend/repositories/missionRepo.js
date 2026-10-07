const db = require('../config/database');
const oracledb = require('oracledb');

class MissionRepo {
    static async getAll({ status, priority, responderId, limit = 50, offset = 0 } = {}) {
        let whereClauses = [];
        let binds = {};

        if (status) {
            whereClauses.push("m.Status = :status");
            binds.status = status;
        }
        if (priority) {
            whereClauses.push("m.Priority = :priority");
            binds.priority = priority;
        }
        if (responderId) {
            whereClauses.push("m.ResponderID = :responderId");
            binds.responderId = Number(responderId);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const sql = `
            SELECT m.MissionID, m.Status, m.Priority, m.StartTime, m.ExpectedEndTime, m.ActualEndTime,
                   r.RequestID, r.RequestType, r.Priority AS RequestPriority, r.Description AS RequestDescription,
                   i.IncidentID, i.IncidentName, i.Severity AS IncidentSeverity,
                   l.LocationName AS TargetLocation, l.Latitude AS TargetLatitude, l.Longitude AS TargetLongitude,
                   resp.ResponderID, resp.TeamName, resp.Specialization,
                   resp_u.FullName AS ResponderLeadName, resp_u.Phone AS ResponderPhone,
                   v.VehicleID, v.VehicleType, v.RegistrationNumber AS VehicleRegistration,
                   assigner.FullName AS AssignedByName,
                   COUNT(DISTINCT fr.ReportID) AS FieldReportCount
            FROM MISSIONS m
            JOIN REQUESTS r ON m.RequestID = r.RequestID
            JOIN INCIDENTS i ON r.IncidentID = i.IncidentID
            JOIN LOCATIONS l ON r.LocationID = l.LocationID
            JOIN RESPONDERS resp ON m.ResponderID = resp.ResponderID
            JOIN USERS resp_u ON resp.UserID = resp_u.UserID
            LEFT JOIN VEHICLES v ON m.VehicleID = v.VehicleID
            JOIN USERS assigner ON m.AssignedBy = assigner.UserID
            LEFT JOIN FIELD_REPORTS fr ON m.MissionID = fr.MissionID
            ${whereSql}
            GROUP BY m.MissionID, m.Status, m.Priority, m.StartTime, m.ExpectedEndTime, m.ActualEndTime,
                     r.RequestID, r.RequestType, r.Priority, r.Description,
                     i.IncidentID, i.IncidentName, i.Severity,
                     l.LocationName, l.Latitude, l.Longitude,
                     resp.ResponderID, resp.TeamName, resp.Specialization,
                     resp_u.FullName, resp_u.Phone,
                     v.VehicleID, v.VehicleType, v.RegistrationNumber,
                     assigner.FullName
            ORDER BY m.StartTime DESC
            OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
        `;

        binds.offset = parseInt(offset, 10);
        binds.limit = parseInt(limit, 10);

        const result = await db.execute(sql, binds);
        return result.rows || [];
    }

    static async getById(missionId) {
        const sql = `
            SELECT m.MissionID, m.Status, m.Priority, m.StartTime, m.ExpectedEndTime, m.ActualEndTime,
                   r.RequestID, r.RequestType, r.Priority AS RequestPriority, r.Description AS RequestDescription,
                   i.IncidentID, i.IncidentName, i.Severity AS IncidentSeverity,
                   l.LocationID AS TargetLocationID, l.LocationName AS TargetLocation, l.Address AS TargetAddress,
                   l.Latitude AS TargetLatitude, l.Longitude AS TargetLongitude,
                   resp.ResponderID, resp.TeamName, resp.Specialization,
                   resp_u.UserID AS ResponderUserID, resp_u.FullName AS ResponderLeadName, resp_u.Phone AS ResponderPhone,
                   v.VehicleID, v.VehicleType, v.RegistrationNumber AS VehicleRegistration,
                   assigner.FullName AS AssignedByName
            FROM MISSIONS m
            JOIN REQUESTS r ON m.RequestID = r.RequestID
            JOIN INCIDENTS i ON r.IncidentID = i.IncidentID
            JOIN LOCATIONS l ON r.LocationID = l.LocationID
            JOIN RESPONDERS resp ON m.ResponderID = resp.ResponderID
            JOIN USERS resp_u ON resp.UserID = resp_u.UserID
            LEFT JOIN VEHICLES v ON m.VehicleID = v.VehicleID
            JOIN USERS assigner ON m.AssignedBy = assigner.UserID
            WHERE m.MissionID = :missionId
        `;

        const result = await db.execute(sql, { missionId: Number(missionId) });
        if (!result.rows || result.rows.length === 0) return null;

        const mission = result.rows[0];

        // Fetch allocated resources
        const resSql = `
            SELECT mr.ResourceID, res.ResourceName, rt.Category, rt.Unit,
                   mr.QuantityAllocated, mr.QuantityUsed, mr.QuantityReturned,
                   u.FullName AS ProviderName
            FROM MISSION_RESOURCES mr
            JOIN RESOURCES res ON mr.ResourceID = res.ResourceID
            JOIN RESOURCE_TYPES rt ON res.ResourceTypeID = rt.ResourceTypeID
            JOIN USERS u ON res.ProviderID = u.UserID
            WHERE mr.MissionID = :missionId
        `;
        const resRes = await db.execute(resSql, { missionId: Number(missionId) });
        mission.resources = resRes.rows || [];

        // Fetch field reports
        const frSql = `
            SELECT fr.ReportID, fr.ReportType, fr.Severity, fr.Description, fr.CreatedAt,
                   resp.TeamName, l.LocationName
            FROM FIELD_REPORTS fr
            JOIN RESPONDERS resp ON fr.ResponderID = resp.ResponderID
            JOIN LOCATIONS l ON fr.LocationID = l.LocationID
            WHERE fr.MissionID = :missionId
            ORDER BY fr.CreatedAt DESC
        `;
        const frRes = await db.execute(frSql, { missionId: Number(missionId) });
        mission.fieldReports = frRes.rows || [];

        return mission;
    }

    /**
     * Invoke Oracle Stored Procedure: CREATE_MISSION
     */
    static async create({ requestId, responderId, vehicleId, assignedBy, priority = 'MEDIUM', expectedEndTime }) {
        const sql = `
            BEGIN
                CREATE_MISSION(
                    p_request_id => :requestId,
                    p_responder_id => :responderId,
                    p_vehicle_id => :vehicleId,
                    p_assigned_by => :assignedBy,
                    p_priority => :priority,
                    p_exp_end_time => :expectedEndTime,
                    p_mission_id => :missionId
                );
            END;
        `;

        const binds = {
            requestId: Number(requestId),
            responderId: Number(responderId),
            vehicleId: vehicleId ? Number(vehicleId) : null,
            assignedBy: Number(assignedBy),
            priority,
            expectedEndTime: expectedEndTime ? new Date(expectedEndTime) : null,
            missionId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        };

        const result = await db.execute(sql, binds);
        return result.outBinds.missionId;
    }

    /**
     * Invoke Oracle Stored Procedure: ALLOCATE_RESOURCE
     */
    static async allocateResource({ missionId, resourceId, quantity, allocatedBy }) {
        const sql = `
            BEGIN
                ALLOCATE_RESOURCE(
                    p_mission_id => :missionId,
                    p_resource_id => :resourceId,
                    p_quantity => :quantity,
                    p_allocated_by => :allocatedBy
                );
            END;
        `;

        const binds = {
            missionId: Number(missionId),
            resourceId: Number(resourceId),
            quantity: Number(quantity),
            allocatedBy: Number(allocatedBy)
        };

        await db.execute(sql, binds);
    }

    /**
     * Invoke Oracle Stored Procedure: UPDATE_MISSION_STATUS
     */
    static async updateStatus({ missionId, newStatus, updatedBy, notes }) {
        const sql = `
            BEGIN
                UPDATE_MISSION_STATUS(
                    p_mission_id => :missionId,
                    p_new_status => :newStatus,
                    p_updated_by => :updatedBy,
                    p_notes => :notes
                );
            END;
        `;

        const binds = {
            missionId: Number(missionId),
            newStatus,
            updatedBy: Number(updatedBy),
            notes: notes || null
        };

        await db.execute(sql, binds);
    }

    /**
     * Invoke Oracle Stored Procedure: COMPLETE_MISSION
     */
    static async complete({ missionId, finishedBy, notes }) {
        const sql = `
            BEGIN
                COMPLETE_MISSION(
                    p_mission_id => :missionId,
                    p_finished_by => :finishedBy,
                    p_notes => :notes
                );
            END;
        `;

        const binds = {
            missionId: Number(missionId),
            finishedBy: Number(finishedBy),
            notes: notes || null
        };

        await db.execute(sql, binds);
    }

    static async addFieldReport({ missionId, responderId, reportType, description, locationId, severity = 'MEDIUM' }) {
        const sql = `
            INSERT INTO FIELD_REPORTS (
                ReportID, MissionID, ResponderID, ReportType, Description, LocationID, Severity, CreatedAt
            ) VALUES (
                SEQ_FIELD_REPORTS.NEXTVAL, :missionId, :responderId, :reportType, :description, :locationId, :severity, CURRENT_TIMESTAMP
            )
        `;

        const binds = {
            missionId: Number(missionId),
            responderId: Number(responderId),
            reportType,
            description,
            locationId: Number(locationId),
            severity
        };

        await db.execute(sql, binds);
    }
}

module.exports = MissionRepo;
