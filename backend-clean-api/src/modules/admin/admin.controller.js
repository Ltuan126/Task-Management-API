const User = require("../../models/user.model");

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

            const user = await User.findByIdAndUpdate(
                id,
                { role },
                { new: true, runValidators: true }
            ).select("-password");

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

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
