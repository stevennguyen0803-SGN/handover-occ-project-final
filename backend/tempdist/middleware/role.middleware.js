"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
function requireRole(roles) {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            return res.status(401).json({
                error: 'UNAUTHORIZED',
                message: 'Authentication is required',
                details: {},
            });
        }
        if (!roles.includes(user.role)) {
            return res.status(403).json({
                error: 'FORBIDDEN',
                message: 'You do not have access to this resource',
                details: {},
            });
        }
        next();
    };
}
