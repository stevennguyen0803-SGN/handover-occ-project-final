"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachAuthenticatedUser = attachAuthenticatedUser;
const auth_bridge_1 = require("../lib/auth-bridge");
function attachAuthenticatedUser(req, _res, next) {
    const authenticatedUser = (0, auth_bridge_1.extractAuthenticatedUserFromRequest)(req);
    if (authenticatedUser) {
        req.user = authenticatedUser;
    }
    next();
}
