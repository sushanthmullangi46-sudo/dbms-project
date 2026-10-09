const db = require('../config/database');

class MapRepo {
    static async getMapMarkers() {
        // 1. Incidents
        const incSql = `
            SELECT i.IncidentID AS "id", i.IncidentName AS "title", i.IncidentType AS "type",
                   i.Severity AS "severity", i.Status AS "status",
                   l.Latitude AS "lat", l.Longitude AS "lng", l.LocationName AS "location",
                   'INCIDENT' AS "markerType"
            FROM INCIDENTS i
            JOIN LOCATIONS l ON i.LocationID = l.LocationID
            WHERE i.Status IN ('ACTIVE', 'ON_HOLD')
        `;
        const incRes = await db.execute(incSql);

        // 2. Pending Requests
        const reqSql = `
            SELECT r.RequestID AS "id", ('Request: ' || r.RequestType) AS "title", r.RequestType AS "type",
                   r.Priority AS "severity", r.Status AS "status", r.PeopleAffected AS "peopleAffected",
                   l.Latitude AS "lat", l.Longitude AS "lng", l.LocationName AS "location",
                   'REQUEST' AS "markerType"
            FROM REQUESTS r
            JOIN LOCATIONS l ON r.LocationID = l.LocationID
            WHERE r.Status IN ('PENDING', 'APPROVED', 'IN_PROGRESS')
        `;
        const reqRes = await db.execute(reqSql);

        // 3. Shelters
        const shelterSql = `
            SELECT s.ShelterID AS "id", s.ShelterName AS "title", s.Status AS "status",
                   s.Capacity AS "capacity", s.CurrentOccupancy AS "occupancy",
                   l.Latitude AS "lat", l.Longitude AS "lng", l.LocationName AS "location",
                   'SHELTER' AS "markerType"
            FROM SHELTERS s
            JOIN LOCATIONS l ON s.LocationID = l.LocationID
        `;
        const shelterRes = await db.execute(shelterSql);

        // 4. Warehouses
        const whSql = `
            SELECT w.WarehouseID AS "id", w.WarehouseName AS "title", w.Status AS "status",
                   w.Capacity AS "capacity",
                   l.Latitude AS "lat", l.Longitude AS "lng", l.LocationName AS "location",
                   'WAREHOUSE' AS "markerType"
            FROM WAREHOUSES w
            JOIN LOCATIONS l ON w.LocationID = l.LocationID
        `;
        const whRes = await db.execute(whSql);

        // 5. Active Responders
        const respSql = `
            SELECT r.ResponderID AS "id", r.TeamName AS "title", r.Specialization AS "specialization",
                   r.CurrentStatus AS "status",
                   l.Latitude AS "lat", l.Longitude AS "lng", l.LocationName AS "location",
                   'RESPONDER' AS "markerType"
            FROM RESPONDERS r
            JOIN LOCATIONS l ON r.CurrentLocationID = l.LocationID
            WHERE r.CurrentStatus IN ('AVAILABLE', 'ASSIGNED', 'ON_MISSION')
        `;
        const respRes = await db.execute(respSql);

        // 6. Active Vehicles
        const vehSql = `
            SELECT v.VehicleID AS "id", (v.VehicleType || ' (' || v.RegistrationNumber || ')') AS "title",
                   v.Status AS "status", v.FuelLevel AS "fuelLevel",
                   l.Latitude AS "lat", l.Longitude AS "lng", l.LocationName AS "location",
                   'VEHICLE' AS "markerType"
            FROM VEHICLES v
            JOIN LOCATIONS l ON v.CurrentLocationID = l.LocationID
            WHERE v.Status IN ('AVAILABLE', 'ALLOCATED', 'IN_USE')
        `;
        const vehRes = await db.execute(vehSql);

        // 7. Municipal Risk Zones & Sectors
        const locSql = `
            SELECT l.LocationID AS "id", l.LocationName AS "name", l.RiskZone AS "riskZone",
                   l.Zone AS "zone", l.Latitude AS "lat", l.Longitude AS "lng",
                   l.Address AS "address"
            FROM LOCATIONS l
        `;
        const locRes = await db.execute(locSql);
        const rawLocations = locRes.rows || [];
        const zones = rawLocations.map(l => ({
            id: l.id || l.LOCATIONID,
            name: l.name || l.LOCATIONNAME,
            riskZone: l.riskZone || l.RISKZONE || 'MODERATE',
            zone: l.zone || l.ZONE || 'Municipal Sector',
            lat: Number(l.lat || l.LATITUDE),
            lng: Number(l.lng || l.LONGITUDE),
            address: l.address || l.ADDRESS
        }));

        return {
            incidents: incRes.rows || [],
            requests: reqRes.rows || [],
            shelters: shelterRes.rows || [],
            warehouses: whRes.rows || [],
            responders: respRes.rows || [],
            vehicles: vehRes.rows || [],
            zones
        };
    }
}

module.exports = MapRepo;
