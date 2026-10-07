const MissionRepo = require('../repositories/missionRepo');

class MissionController {
    static async list(req, res, next) {
        try {
            const { status, priority, responderId, limit, offset } = req.query;
            const missions = await MissionRepo.getAll({ status, priority, responderId, limit, offset });
            return res.json({ success: true, count: missions.length, missions });
        } catch (err) {
            next(err);
        }
    }

    static async getById(req, res, next) {
        try {
            const mission = await MissionRepo.getById(req.params.id);
            if (!mission) {
                return res.status(404).json({
                    success: false,
                    code: 'MISSION_NOT_FOUND',
                    message: `Mission #${req.params.id} does not exist.`
                });
            }
            return res.json({ success: true, mission });
        } catch (err) {
            next(err);
        }
    }

    static async create(req, res, next) {
        try {
            const { requestId, responderId, vehicleId, priority, expectedEndTime } = req.body;
            if (!requestId || !responderId) {
                return res.status(400).json({
                    success: false,
                    code: 'VALIDATION_ERROR',
                    message: 'requestId and responderId are required.'
                });
            }

            const missionId = await MissionRepo.create({
                requestId,
                responderId,
                vehicleId,
                assignedBy: req.user.userId,
                priority,
                expectedEndTime
            });

            return res.status(201).json({
                success: true,
                message: 'Tactical mission initiated successfully.',
                missionId
            });
        } catch (err) {
            next(err);
        }
    }

    static async allocateResource(req, res, next) {
        try {
            const { resourceId, quantity } = req.body;
            if (!resourceId || !quantity || quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    code: 'VALIDATION_ERROR',
                    message: 'resourceId and positive quantity are required.'
                });
            }

            await MissionRepo.allocateResource({
                missionId: req.params.id,
                resourceId,
                quantity,
                allocatedBy: req.user.userId
            });

            return res.json({
                success: true,
                message: 'Resource allocated to mission with transaction lock verification.'
            });
        } catch (err) {
            next(err);
        }
    }

    static async updateStatus(req, res, next) {
        try {
            const { status, notes } = req.body;
            if (!status) {
                return res.status(400).json({
                    success: false,
                    code: 'VALIDATION_ERROR',
                    message: 'status is required.'
                });
            }

            await MissionRepo.updateStatus({
                missionId: req.params.id,
                newStatus: status,
                updatedBy: req.user.userId,
                notes
            });

            return res.json({
                success: true,
                message: `Mission status updated to ${status}.`
            });
        } catch (err) {
            next(err);
        }
    }

    static async complete(req, res, next) {
        try {
            const { notes } = req.body;
            await MissionRepo.complete({
                missionId: req.params.id,
                finishedBy: req.user.userId,
                notes
            });

            return res.json({
                success: true,
                message: `Mission #${req.params.id} completed. Responder and vehicle released.`
            });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = MissionController;
