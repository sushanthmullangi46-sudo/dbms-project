const ReportRepo = require('../repositories/reportRepo');

class ReportController {
    static async getReport(req, res, next) {
        try {
            const reportId = req.params.reportId;
            const data = await ReportRepo.getReport(reportId);
            return res.json({
                success: true,
                reportId: parseInt(reportId, 10),
                count: data.length,
                data
            });
        } catch (err) {
            next(err);
        }
    }

    static async getAuditLogs(req, res, next) {
        try {
            const { incidentId, limit, offset } = req.query;
            const logs = await ReportRepo.getAuditLogs({ incidentId, limit, offset });
            return res.json({
                success: true,
                count: logs.length,
                logs
            });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = ReportController;
