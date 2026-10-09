const ReportRepo = require('../repositories/reportRepo');

class ReportController {
    static async createReport(req, res, next) {
        try {
            const reportData = req.body;
            const newReport = await ReportRepo.createReport(reportData, req.user);
            return res.status(201).json({
                success: true,
                message: "Stage 1 Complete: Emergency report logged in Oracle database!",
                report_id: newReport.report_id,
                report_reference_id: newReport.report_reference_id,
                status: newReport.status || 'SUBMITTED',
                ...newReport
            });
        } catch (err) {
            next(err);
        }
    }

    static async listReports(req, res, next) {
        try {
            const { status, disaster_type } = req.query;
            const reports = await ReportRepo.listReports({ status, disaster_type });
            return res.json({
                success: true,
                count: reports.length,
                reports
            });
        } catch (err) {
            next(err);
        }
    }

    static async getReport(req, res, next) {
        try {
            const reportId = req.params.reportId;
            const store = require('../config/memoryStore');
            const citizenReport = (store.citizenReports || []).find(r => r.report_id === Number(reportId) || r.id === Number(reportId));
            if (citizenReport) {
                return res.json({
                    success: true,
                    report: citizenReport,
                    ...citizenReport
                });
            }
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
