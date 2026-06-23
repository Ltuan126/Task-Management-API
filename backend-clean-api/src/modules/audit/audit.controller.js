const AuditLog = require("../../models/audit-log.model");
const { escapeRegex } = require("../../utils/escapeRegex");

class AuditController {
    async getAuditLogs(req, res, next) {
        try {
            const { page = 1, limit = 50, action, email } = req.query;

            const filter = {};
            if (action) {
                filter.action = action;
            }
            if (email) {
                filter.email = { $regex: escapeRegex(email), $options: "i" };
            }

            const pageNum = parseInt(page, 10) || 1;
            const limitNum = Math.min(parseInt(limit, 10) || 50, 100);
            const skip = (pageNum - 1) * limitNum;

            const [logs, total] = await Promise.all([
                AuditLog.find(filter)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limitNum),
                AuditLog.countDocuments(filter),
            ]);

            return res.json({
                items: logs,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum) || 1,
                },
            });
        } catch (error) {
            return next(error);
        }
    }
}

module.exports = new AuditController();
