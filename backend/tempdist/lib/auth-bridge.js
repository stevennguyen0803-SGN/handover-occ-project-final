"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractAuthenticatedUserFromRequest = extractAuthenticatedUserFromRequest;
const node_crypto_1 = require("node:crypto");
const client_1 = require("@prisma/client");
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;
const backendAuthHeaderNames = {
    id: 'x-occ-auth-user-id',
    name: 'x-occ-auth-user-name',
    email: 'x-occ-auth-user-email',
    role: 'x-occ-auth-user-role',
    timestamp: 'x-occ-auth-timestamp',
    signature: 'x-occ-auth-signature',
};
function isUserRole(value) {
    return Object.values(client_1.UserRole).includes(value);
}
function getAuthSecret() {
    const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
    return typeof secret === 'string' && secret.length > 0 ? secret : null;
}
function buildBackendAuthPayload(user, timestamp) {
    return [
        user.id,
        user.name,
        user.email,
        user.role,
        timestamp,
    ].join(':');
}
function buildBackendAuthSignature(user, timestamp, secret) {
    return (0, node_crypto_1.createHmac)('sha256', secret)
        .update(buildBackendAuthPayload(user, timestamp))
        .digest('base64url');
}
function hasValidClockSkew(timestamp) {
    const parsedTimestamp = Number(timestamp);
    if (!Number.isFinite(parsedTimestamp)) {
        return false;
    }
    return Math.abs(Date.now() - parsedTimestamp) <= MAX_CLOCK_SKEW_MS;
}
function signaturesMatch(expected, actual) {
    const expectedBuffer = Buffer.from(expected);
    const actualBuffer = Buffer.from(actual);
    if (expectedBuffer.length !== actualBuffer.length) {
        return false;
    }
    return (0, node_crypto_1.timingSafeEqual)(expectedBuffer, actualBuffer);
}
function extractAuthenticatedUserFromRequest(req) {
    const secret = getAuthSecret();
    if (!secret) {
        return null;
    }
    const id = req.header(backendAuthHeaderNames.id);
    const name = req.header(backendAuthHeaderNames.name);
    const email = req.header(backendAuthHeaderNames.email);
    const role = req.header(backendAuthHeaderNames.role);
    const timestamp = req.header(backendAuthHeaderNames.timestamp);
    const signature = req.header(backendAuthHeaderNames.signature);
    if (typeof id !== 'string' ||
        typeof name !== 'string' ||
        typeof email !== 'string' ||
        typeof role !== 'string' ||
        typeof timestamp !== 'string' ||
        typeof signature !== 'string' ||
        !isUserRole(role) ||
        !hasValidClockSkew(timestamp)) {
        return null;
    }
    const user = {
        id,
        name,
        email,
        role,
    };
    const expectedSignature = buildBackendAuthSignature(user, timestamp, secret);
    return signaturesMatch(expectedSignature, signature) ? user : null;
}
