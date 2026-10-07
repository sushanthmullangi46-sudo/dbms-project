const ResourceRepo = require('../repositories/resourceRepo');

class ResourceController {
    static async list(req, res, next) {
        try {
            const { availabilityStatus, category, providerId, limit, offset } = req.query;
            const resources = await ResourceRepo.getAll({ availabilityStatus, category, providerId, limit, offset });
            return res.json({ success: true, count: resources.length, resources });
        } catch (err) {
            next(err);
        }
    }

    static async getById(req, res, next) {
        try {
            const resource = await ResourceRepo.getById(req.params.id);
            if (!resource) {
                return res.status(404).json({
                    success: false,
                    code: 'RESOURCE_NOT_FOUND',
                    message: `Resource #${req.params.id} does not exist.`
                });
            }
            return res.json({ success: true, resource });
        } catch (err) {
            next(err);
        }
    }

    static async getTypes(req, res, next) {
        try {
            const types = await ResourceRepo.getResourceTypes();
            return res.json({ success: true, types });
        } catch (err) {
            next(err);
        }
    }

    static async getVehicles(req, res, next) {
        try {
            const { status, providerId } = req.query;
            const vehicles = await ResourceRepo.getVehicles({ status, providerId });
            return res.json({ success: true, count: vehicles.length, vehicles });
        } catch (err) {
            next(err);
        }
    }

    static async getResponders(req, res, next) {
        try {
            const { status, availabilityStatus } = req.query;
            const responders = await ResourceRepo.getResponders({ status, availabilityStatus });
            return res.json({ success: true, count: responders.length, responders });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = ResourceController;
