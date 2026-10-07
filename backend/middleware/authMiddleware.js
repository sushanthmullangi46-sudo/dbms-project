const jwt = require('jsonwebtoken');

/**
 * Authentication Middleware
 * Validates JWT token and attaches user payload to req.user
 */
function authenticateUser(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).json({
            success: false,
            code: 'AUTH_REQUIRED',
            message: 'Authorization header missing. Bearer token required.'
        });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({
            success: false,
            code: 'INVALID_TOKEN_FORMAT',
            message: 'Token format must be "Bearer <token>"'
        });
    }

    const token = parts[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_udr_orp_emergency_2026!');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            code: 'TOKEN_EXPIRED_OR_INVALID',
            message: 'Session invalid or expired. Please sign in again.'
        });
    }
}

module.exports = authenticateUser;
