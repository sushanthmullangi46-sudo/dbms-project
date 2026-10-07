const IncidentRepo = require('../repositories/incidentRepo');

class IncidentController {
    static async list(req, res, next) {
        try {
            const { status, severity, search, limit, offset } = req.query;
            const incidents = await IncidentRepo.getAll({ status, severity, search, limit, offset });
            return res.json({ success: true, count: incidents.length, incidents });
        } catch (err) {
            next(err);
        }
    }

    static async getById(req, res, next) {
        try {
            const incident = await IncidentRepo.getById(req.params.id);
            if (!incident) {
                return res.status(404).json({
                    success: false,
                    code: 'INCIDENT_NOT_FOUND',
                    message: `Incident #${req.params.id} does not exist.`
                });
            }
            return res.json({ success: true, incident });
        } catch (err) {
            next(err);
        }
    }

    static async create(req, res, next) {
        try {
            const { incidentName, incidentType, severity, locationId, description } = req.body;
            if (!incidentName || !incidentType || !severity || !locationId || !description) {
                return res.status(400).json({
                    success: false,
                    code: 'VALIDATION_ERROR',
                    message: 'All fields (incidentName, incidentType, severity, locationId, description) are required.'
                });
            }

            const incidentId = await IncidentRepo.create({
                incidentName,
                incidentType,
                severity,
                locationId,
                description,
                createdBy: req.user.userId
            });

            return res.status(201).json({
                success: true,
                message: 'Disaster incident initialized successfully.',
                incidentId
            });
        } catch (err) {
            next(err);
        }
    }

    static async update(req, res, next) {
        try {
            const { incidentName, status, severity, description } = req.body;
            await IncidentRepo.update(req.params.id, {
                incidentName,
                status,
                severity,
                description,
                userId: req.user.userId
            });

            return res.json({
                success: true,
                message: `Incident #${req.params.id} updated successfully.`
            });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = IncidentController;
