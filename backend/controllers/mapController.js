const MapRepo = require('../repositories/mapRepo');

class MapController {
    static async getMarkers(req, res, next) {
        try {
            const markers = await MapRepo.getMapMarkers();
            return res.json({
                success: true,
                markers
            });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = MapController;
