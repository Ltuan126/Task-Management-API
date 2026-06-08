const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },
        email: {
            type: String,
            required: false,
        },
        action: {
            type: String,
            required: true,
        },
        details: {
            type: mongoose.Schema.Types.Mixed,
            required: false,
        },
        ipAddress: {
            type: String,
            required: false,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

// TTL index to automatically expire documents after 90 days (90 * 24 * 3600 seconds)
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
