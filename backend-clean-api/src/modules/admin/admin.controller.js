const User = require("../../models/user.model");

class AdminController {
    async getAllUsers(req, res, next) {
        try {
            // Find all users except selecting password
            const users = await User.find({}).select("-password").sort({ createdAt: -1 });
            return res.json(users);
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
