const MissionRepo = require('../repositories/missionRepo');
const ResourceRepo = require('../repositories/resourceRepo');

class ResponderController {
    static async getMyMissions(req, res, next) {
        try {
            const responder = await ResourceRepo.getResponderByUserId(req.user.userId);
            if (!responder) {
                return res.status(404).json({
                    success: false,
                    code: 'RESPONDER_PROFILE_NOT_FOUND',
                    message: 'No responder team record linked to this account.'
                });
            }

            const missions = await MissionRepo.getAll({ responderId: responder.RESPONDERID });
            return res.json({
                success: true,
                responder,
                count: missions.length,
                missions
            });
        } catch (err) {
            next(err);
        }
    }

    static async getMissionById(req, res, next) {
        try {
            const responder = await ResourceRepo.getResponderByUserId(req.user.userId);
            if (!responder) {
                return res.status(404).json({
                    success: false,
                    code: 'RESPONDER_PROFILE_NOT_FOUND',
                    message: 'No responder profile found.'
                });
            }

            const mission = await MissionRepo.getById(req.params.id);
            if (!mission) {
                return res.status(404).json({
                    success: false,
                    code: 'MISSION_NOT_FOUND',
                    message: `Mission #${req.params.id} does not exist.`
                });
            }

            // Rule 8: Only assigned responders can update/view their missions
            if (mission.RESPONDERID !== responder.RESPONDERID) {
                return res.status(403).json({
                    success: false,
                    code: 'FORBIDDEN',
                    message: 'Access denied: You are not assigned to this mission.'
                });
            }

            return res.json({ success: true, mission });
        } catch (err) {
            next(err);
        }
    }

    static async updateStatus(req, res, next) {
        try {
            const responder = await ResourceRepo.getResponderByUserId(req.user.userId);
            if (!responder) {
                return res.status(404).json({
                    success: false,
                    code: 'RESPONDER_PROFILE_NOT_FOUND',
                    message: 'No responder profile found.'
                });
            }

            const mission = await MissionRepo.getById(req.params.id);
            if (!mission) {
                return res.status(404).json({
                    success: false,
                    code: 'MISSION_NOT_FOUND',
                    message: `Mission #${req.params.id} does not exist.`
                });
            }

            if (mission.RESPONDERID !== responder.RESPONDERID) {
                return res.status(403).json({
                    success: false,
                    code: 'FORBIDDEN',
                    message: 'Access denied: You are not assigned to this mission.'
                });
            }

            const { status, notes } = req.body;
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

    static async submitReport(req, res, next) {
        try {
            const responder = await ResourceRepo.getResponderByUserId(req.user.userId);
            if (!responder) {
                return res.status(404).json({
                    success: false,
                    code: 'RESPONDER_PROFILE_NOT_FOUND',
                    message: 'No responder profile found.'
                });
            }

            const { reportType, description, locationId, severity } = req.body;
            if (!reportType || !description || !locationId) {
                return res.status(400).json({
                    success: false,
                    code: 'VALIDATION_ERROR',
                    message: 'reportType, description, and locationId are required.'
                });
            }

            await MissionRepo.addFieldReport({
                missionId: req.params.id,
                responderId: responder.RESPONDERID,
                reportType,
                description,
                locationId,
                severity: severity || 'MEDIUM'
            });

            return res.status(201).json({
                success: true,
                message: 'Field report logged successfully.'
            });
        } catch (err) {
            next(err);
        }
    }

    static async completeMission(req, res, next) {
        try {
            const responder = await ResourceRepo.getResponderByUserId(req.user.userId);
            if (!responder) {
                return res.status(404).json({
                    success: false,
                    code: 'RESPONDER_PROFILE_NOT_FOUND',
                    message: 'No responder profile found.'
                });
            }

            const mission = await MissionRepo.getById(req.params.id);
            if (!mission) {
                return res.status(404).json({
                    success: false,
                    code: 'MISSION_NOT_FOUND',
                    message: `Mission #${req.params.id} does not exist.`
                });
            }

            if (mission.RESPONDERID !== responder.RESPONDERID) {
                return res.status(403).json({
                    success: false,
                    code: 'FORBIDDEN',
                    message: 'Access denied: You are not assigned to this mission.'
                });
            }

            const { notes } = req.body;
            await MissionRepo.complete({
                missionId: req.params.id,
                finishedBy: req.user.userId,
                notes
            });

            return res.json({
                success: true,
                message: `Mission #${req.params.id} completed. Team marked available.`
            });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = ResponderController;
