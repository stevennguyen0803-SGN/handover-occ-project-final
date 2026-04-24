"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildChangedFields = buildChangedFields;
exports.writeAuditLog = writeAuditLog;
function normalizeAuditSnapshot(value) {
    if (value == null) {
        return undefined;
    }
    return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined));
}
function areAuditValuesEqual(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
}
function buildChangedFields(previous, next) {
    const keys = new Set([...Object.keys(previous), ...Object.keys(next)]);
    const oldValue = {};
    const newValue = {};
    keys.forEach((key) => {
        if (!areAuditValuesEqual(previous[key], next[key])) {
            oldValue[key] = previous[key];
            newValue[key] = next[key];
        }
    });
    return {
        oldValue: Object.keys(oldValue).length > 0 ? oldValue : null,
        newValue: Object.keys(newValue).length > 0 ? newValue : null,
    };
}
async function writeAuditLog(input) {
    const oldValue = normalizeAuditSnapshot(input.oldValue);
    const newValue = normalizeAuditSnapshot(input.newValue);
    await input.db.auditLog.create({
        data: {
            handoverId: input.handoverId,
            userId: input.userId,
            action: input.action,
            targetModel: input.targetModel,
            targetId: input.targetId,
            ...(oldValue !== undefined ? { oldValue } : {}),
            ...(newValue !== undefined ? { newValue } : {}),
        },
    });
}
