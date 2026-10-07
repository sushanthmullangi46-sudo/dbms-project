const ResourceRepo = require('../repositories/resourceRepo');
const db = require('../config/database');

class ProviderController {
    static async getMyResources(req, res, next) {
        try {
            const resources = await ResourceRepo.getAll({ providerId: req.user.userId });
            const vehicles = await ResourceRepo.getVehicles({ providerId: req.user.userId });
            return res.json({
                success: true,
                resources,
                vehicles
            });
        } catch (err) {
            next(err);
        }
    }

    static async createResource(req, res, next) {
        try {
            const { resourceTypeId, resourceName, quantity, condition, currentLocationId, registrationNumber } = req.body;
            if (!resourceTypeId || !resourceName || !quantity) {
                return res.status(400).json({
                    success: false,
                    code: 'VALIDATION_ERROR',
                    message: 'resourceTypeId, resourceName, and quantity are required.'
                });
            }

            const resourceId = await ResourceRepo.createResource({
                providerId: req.user.userId,
                resourceTypeId,
                resourceName,
                quantity,
                condition,
                currentLocationId,
                registrationNumber
            });

            return res.status(201).json({
                success: true,
                message: 'Resource registered successfully.',
                resourceId
            });
        } catch (err) {
            next(err);
        }
    }

    static async updateResource(req, res, next) {
        try {
            const { quantity, condition, availabilityStatus, currentLocationId } = req.body;
            await ResourceRepo.updateResource(req.params.id, req.user.userId, {
                quantity,
                condition,
                availabilityStatus,
                currentLocationId
            });

            return res.json({
                success: true,
                message: `Resource #${req.params.id} updated.`
            });
        } catch (err) {
            next(err);
        }
    }

    static async getMyAllocations(req, res, next) {
        try {
            const sql = `
                SELECT mr.MissionID, m.Status AS MissionStatus, m.StartTime,
                       r.ResourceID, r.ResourceName, rt.ResourceName AS TypeName, rt.Category,
                       mr.QuantityAllocated, mr.QuantityUsed, mr.QuantityReturned,
                       resp.TeamName AS ResponderTeam,
                       inc.IncidentName
                FROM MISSION_RESOURCES mr
                JOIN RESOURCES r ON mr.ResourceID = r.ResourceID
                JOIN RESOURCE_TYPES rt ON r.ResourceTypeID = rt.ResourceTypeID
                JOIN MISSIONS m ON mr.MissionID = m.MissionID
                JOIN RESPONDERS resp ON m.ResponderID = resp.ResponderID
                JOIN REQUESTS req ON m.RequestID = req.RequestID
                JOIN INCIDENTS inc ON req.IncidentID = inc.IncidentID
                WHERE r.ProviderID = :providerId
                ORDER BY m.StartTime DESC
            `;
            const result = await db.execute(sql, { providerId: Number(req.user.userId) });
            return res.json({ success: true, count: result.rows.length, allocations: result.rows || [] });
        } catch (err) {
            next(err);
        }
    }

    static async recordHandover(req, res, next) {
        try {
            const { resourceId, toUserId, quantity, handoverLocationId, conditionBefore, conditionAfter, notes } = req.body;
            if (!resourceId || !toUserId || !quantity || !handoverLocationId) {
                return res.status(400).json({
                    success: false,
                    code: 'VALIDATION_ERROR',
                    message: 'resourceId, toUserId, quantity, and handoverLocationId are required.'
                });
            }

            const sql = `
                INSERT INTO RESOURCE_HANDOVERS (
                    HandoverID, ResourceID, FromUserID, ToUserID, Quantity,
                    HandoverLocationID, HandoverTime, ConditionBefore, ConditionAfter, Notes
                ) VALUES (
                    SEQ_HANDOVERS.NEXTVAL, :resourceId, :fromUserId, :toUserId, :quantity,
                    :handoverLocationId, CURRENT_TIMESTAMP, :conditionBefore, :conditionAfter, :notes
                )
            `;

            await db.execute(sql, {
                resourceId: Number(resourceId),
                fromUserId: Number(req.user.userId),
                toUserId: Number(toUserId),
                quantity: Number(quantity),
                handoverLocationId: Number(handoverLocationId),
                conditionBefore: conditionBefore || 'GOOD',
                conditionAfter: conditionAfter || 'GOOD',
                notes: notes || null
            });

            return res.status(201).json({
                success: true,
                message: 'Resource handover record registered successfully.'
            });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = ProviderController;
