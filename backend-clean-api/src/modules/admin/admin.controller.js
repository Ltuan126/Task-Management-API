const User = require("../../models/user.model");
const auditService = require("../audit/audit.service");

class AdminController {
    async getAllUsers(req, res, next) {
        try {
            const { page = 1, limit = 10 } = req.query;

            const pageNum = Math.max(parseInt(page, 10) || 1, 1);
            const limitNum = Math.max(Math.min(parseInt(limit, 10) || 10, 100), 1);
            const skip = (pageNum - 1) * limitNum;

            const [users, total] = await Promise.all([
                User.find({})
                    .select("-password")
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limitNum),
                User.countDocuments({}),
            ]);

            return res.json({
                items: users,
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

    async updateUserRole(req, res, next) {
        try {
            const { id } = req.params;
            const { role } = req.body;

            if (!["user", "admin"].includes(role)) {
                return res.status(400).json({ message: "Invalid role. Must be 'user' or 'admin'." });
            }

            // Prevent self role modification (optional, but good practice)
            if (id === req.user.id && role !== req.user.role) {
                return res.status(400).json({ message: "Cannot modify your own role." });
            }

            // Read the current role first so the audit entry can record the
            // before/after transition, not just the final value.
            const existingUser = await User.findById(id).select("-password");

            if (!existingUser) {
                return res.status(404).json({ message: "User not found" });
            }

            const previousRole = existingUser.role;

            const user = await User.findByIdAndUpdate(
                id,
                { role },
                { new: true, runValidators: true }
            ).select("-password");

            // Guards against the user being deleted between the read above and
            // this update.
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // Privileged action — always audited, even when the role is unchanged.
            auditService.log({
                userId: req.user.id,
                email: req.user.email,
                action: "USER_ROLE_CHANGED",
                ipAddress: req.ip,
                details: {
                    targetUserId: id,
                    targetEmail: user.email,
                    from: previousRole,
                    to: role,
                },
            });

            return res.json({
                message: "User role updated successfully",
                user,
            });
        } catch (error) {
            return next(error);
        }
    }
}

module.exports = new AdminController();
