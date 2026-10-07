const DashboardRepo = require('../repositories/dashboardRepo');

class DashboardController {
    static async getMetrics(req, res, next) {
        try {
            const data = await DashboardRepo.getMetrics();
            return res.json({
                success: true,
                data
            });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = DashboardController;
