/**
 * Role-Based Authorization Middleware
 * Enforces strict role access on endpoints.
 * @param {string|string[]} allowedRoles Single role or array of allowed roles
 */
function authorizeRole(allowedRoles) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    return (req, res, next) => {
        if (!req.user || !req.user.roleName) {
            return res.status(403).json({
                success: false,
                code: 'FORBIDDEN',
                message: 'Access denied: User credentials unverified.'
            });
        }

        if (!roles.includes(req.user.roleName)) {
            return res.status(403).json({
                success: false,
                code: 'ROLE_UNAUTHORIZED',
                message: `Forbidden: Endpoint restricted to [${roles.join(', ')}]. Current role: ${req.user.roleName}`
            });
        }

        next();
    };
}

module.exports = authorizeRole;
