const db = require('../config/database');

class ResourceRepo {
    static async getAll({ availabilityStatus, category, providerId, limit = 50, offset = 0 } = {}) {
        let whereClauses = [];
        let binds = {};

        if (availabilityStatus) {
            whereClauses.push("r.AvailabilityStatus = :availabilityStatus");
            binds.availabilityStatus = availabilityStatus;
        }
        if (category) {
            whereClauses.push("rt.Category = :category");
            binds.category = category;
        }
        if (providerId) {
            whereClauses.push("r.ProviderID = :providerId");
            binds.providerId = Number(providerId);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const sql = `
            SELECT r.ResourceID, r.ResourceName, r.Quantity, r.Condition, r.AvailabilityStatus,
                   r.RegistrationNumber, r.CreatedAt,
                   rt.ResourceTypeID, rt.ResourceName AS ResourceTypeName, rt.Category, rt.Unit,
                   u.UserID AS ProviderID, u.FullName AS ProviderName, u.Phone AS ProviderPhone,
                   l.LocationID, l.LocationName, l.City, l.Latitude, l.Longitude
            FROM RESOURCES r
            JOIN RESOURCE_TYPES rt ON r.ResourceTypeID = rt.ResourceTypeID
            JOIN USERS u ON r.ProviderID = u.UserID
            LEFT JOIN LOCATIONS l ON r.CurrentLocationID = l.LocationID
            ${whereSql}
            ORDER BY r.ResourceID DESC
            OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
        `;

        binds.offset = parseInt(offset, 10);
        binds.limit = parseInt(limit, 10);

        const result = await db.execute(sql, binds);
        return result.rows || [];
    }

    static async getById(resourceId) {
        const sql = `
            SELECT r.ResourceID, r.ResourceName, r.Quantity, r.Condition, r.AvailabilityStatus,
                   r.RegistrationNumber, r.CreatedAt,
                   rt.ResourceTypeID, rt.ResourceName AS ResourceTypeName, rt.Category, rt.Unit,
                   u.UserID AS ProviderID, u.FullName AS ProviderName,
                   l.LocationID, l.LocationName
            FROM RESOURCES r
            JOIN RESOURCE_TYPES rt ON r.ResourceTypeID = rt.ResourceTypeID
            JOIN USERS u ON r.ProviderID = u.UserID
            LEFT JOIN LOCATIONS l ON r.CurrentLocationID = l.LocationID
            WHERE r.ResourceID = :resourceId
        `;
        const result = await db.execute(sql, { resourceId: Number(resourceId) });
        return result.rows && result.rows.length > 0 ? result.rows[0] : null;
    }

    static async getResourceTypes() {
        const sql = `
            SELECT ResourceTypeID, ResourceName, Category, Unit, Description
            FROM RESOURCE_TYPES
            ORDER BY Category, ResourceName
        `;
        const result = await db.execute(sql);
        return result.rows || [];
    }

    static async getVehicles({ status, providerId } = {}) {
        let whereClauses = [];
        let binds = {};

        if (status) {
            whereClauses.push("v.Status = :status");
            binds.status = status;
        }
        if (providerId) {
            whereClauses.push("v.ProviderID = :providerId");
            binds.providerId = Number(providerId);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const sql = `
            SELECT v.VehicleID, v.VehicleType, v.RegistrationNumber, v.Capacity,
                   v.FuelLevel, v.Status, v.CreatedAt,
                   u.FullName AS ProviderName,
                   l.LocationName, l.Latitude, l.Longitude
            FROM VEHICLES v
            JOIN USERS u ON v.ProviderID = u.UserID
            LEFT JOIN LOCATIONS l ON v.CurrentLocationID = l.LocationID
            ${whereSql}
            ORDER BY v.Status ASC, v.FuelLevel DESC
        `;
        const result = await db.execute(sql, binds);
        return result.rows || [];
    }

    static async getResponders({ status, availabilityStatus } = {}) {
        let whereClauses = [];
        let binds = {};

        if (status) {
            whereClauses.push("r.CurrentStatus = :status");
            binds.status = status;
        }
        if (availabilityStatus) {
            whereClauses.push("r.AvailabilityStatus = :availabilityStatus");
            binds.availabilityStatus = availabilityStatus;
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const sql = `
            SELECT r.ResponderID, r.UserID, r.TeamName, r.Specialization,
                   r.ExperienceLevel, r.CurrentStatus, r.AvailabilityStatus,
                   u.FullName AS LeadName, u.Phone AS ContactPhone, u.Email,
                   l.LocationName, l.Latitude, l.Longitude
            FROM RESPONDERS r
            JOIN USERS u ON r.UserID = u.UserID
            LEFT JOIN LOCATIONS l ON r.CurrentLocationID = l.LocationID
            ${whereSql}
            ORDER BY r.AvailabilityStatus ASC, r.ExperienceLevel DESC
        `;
        const result = await db.execute(sql, binds);
        return result.rows || [];
    }

    static async getResponderByUserId(userId) {
        const sql = `
            SELECT r.ResponderID, r.UserID, r.TeamName, r.Specialization,
                   r.ExperienceLevel, r.CurrentStatus, r.AvailabilityStatus,
                   r.CurrentLocationID
            FROM RESPONDERS r
            WHERE r.UserID = :userId
        `;
        const result = await db.execute(sql, { userId: Number(userId) });
        return result.rows && result.rows.length > 0 ? result.rows[0] : null;
    }

    static async createResource({ providerId, resourceTypeId, resourceName, quantity, condition = 'GOOD', currentLocationId, registrationNumber }) {
        const sql = `
            INSERT INTO RESOURCES (
                ResourceID, ProviderID, ResourceTypeID, ResourceName,
                Quantity, Condition, AvailabilityStatus, CurrentLocationID,
                RegistrationNumber, CreatedAt
            ) VALUES (
                SEQ_RESOURCES.NEXTVAL, :providerId, :resourceTypeId, :resourceName,
                :quantity, :condition, 'AVAILABLE', :currentLocationId,
                :registrationNumber, CURRENT_TIMESTAMP
            ) RETURNING ResourceID INTO :resId
        `;
        const oracledb = require('oracledb');
        const binds = {
            providerId: Number(providerId),
            resourceTypeId: Number(resourceTypeId),
            resourceName,
            quantity: Number(quantity),
            condition,
            currentLocationId: currentLocationId ? Number(currentLocationId) : null,
            registrationNumber: registrationNumber || null,
            resId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        };
        const result = await db.execute(sql, binds);
        return result.outBinds.resId;
    }

    static async updateResource(resourceId, providerId, { quantity, condition, availabilityStatus, currentLocationId }) {
        let setClauses = [];
        let binds = { resourceId: Number(resourceId), providerId: Number(providerId) };

        if (quantity !== undefined) {
            setClauses.push("Quantity = :quantity");
            binds.quantity = Number(quantity);
        }
        if (condition) {
            setClauses.push("Condition = :condition");
            binds.condition = condition;
        }
        if (availabilityStatus) {
            setClauses.push("AvailabilityStatus = :availabilityStatus");
            binds.availabilityStatus = availabilityStatus;
        }
        if (currentLocationId) {
            setClauses.push("CurrentLocationID = :currentLocationId");
            binds.currentLocationId = Number(currentLocationId);
        }

        if (setClauses.length === 0) return;

        const sql = `
            UPDATE RESOURCES
            SET ${setClauses.join(', ')}
            WHERE ResourceID = :resourceId AND ProviderID = :providerId
        `;
        await db.execute(sql, binds);
    }
}

module.exports = ResourceRepo;
