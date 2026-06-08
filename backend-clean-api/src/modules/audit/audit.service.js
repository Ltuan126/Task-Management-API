const AuditLog = require("../../models/audit-log.model");

class AuditService {
    async log({ userId, email, action, details, ipAddress }) {
        try {
            return await AuditLog.create({
                userId,
                email,
                action,
                details,
                ipAddress,
            });
        } catch (error) {
            console.error("Failed to create audit log:", error);
        }
    }
}

module.exports = new AuditService();
