const RequestRepo = require('../repositories/requestRepo');

class RequestController {
    static async list(req, res, next) {
        try {
            const { status, priority, incidentId, requestType, limit, offset } = req.query;
            const requests = await RequestRepo.getAll({ status, priority, incidentId, requestType, limit, offset });
            return res.json({ success: true, count: requests.length, requests });
        } catch (err) {
            next(err);
        }
    }

    static async getById(req, res, next) {
        try {
            const request = await RequestRepo.getById(req.params.id);
            if (!request) {
                return res.status(404).json({
                    success: false,
                    code: 'REQUEST_NOT_FOUND',
                    message: `Request #${req.params.id} does not exist.`
                });
            }
            return res.json({ success: true, request });
        } catch (err) {
            next(err);
        }
    }

    static async create(req, res, next) {
        try {
            const { incidentId, locationId, requestType, priority, peopleAffected, description, items } = req.body;
            if (!incidentId || !locationId || !requestType || !priority || !description) {
                return res.status(400).json({
                    success: false,
                    code: 'VALIDATION_ERROR',
                    message: 'incidentId, locationId, requestType, priority, and description are required.'
                });
            }

            const requestId = await RequestRepo.create({
                incidentId,
                locationId,
                requestedBy: req.user.userId,
                requestType,
                priority,
                peopleAffected,
                description,
                items
            });

            return res.status(201).json({
                success: true,
                message: 'Emergency request registered successfully.',
                requestId
            });
        } catch (err) {
            next(err);
        }
    }

    static async updateStatus(req, res, next) {
        try {
            const { status } = req.body;
            if (!status) {
                return res.status(400).json({
                    success: false,
                    code: 'VALIDATION_ERROR',
                    message: 'Status is required.'
                });
            }

            await RequestRepo.updateStatus(req.params.id, status);
            return res.json({
                success: true,
                message: `Request #${req.params.id} status updated to ${status}.`
            });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = RequestController;
