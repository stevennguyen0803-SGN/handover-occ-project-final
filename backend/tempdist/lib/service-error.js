"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceError = void 0;
exports.isServiceError = isServiceError;
class ServiceError extends Error {
    statusCode;
    code;
    details;
    constructor(statusCode, code, message, details = {}) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }
}
exports.ServiceError = ServiceError;
function isServiceError(error) {
    return error instanceof ServiceError;
}
