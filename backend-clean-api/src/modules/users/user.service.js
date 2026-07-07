const userRepository = require("./user.repository");

class UserService {
    async getProfile(userId) {
        const user = await userRepository.findById(userId);
        if (!user) {
            const error = new Error("User not found");
            error.statusCode = 404;
            throw error;
        }
        return user;
    }

    async updateProfile(userId, data) {
        // Only allow updating name and email
        const allowedFields = {};
        if (data.name !== undefined) allowedFields.name = data.name;
        if (data.email !== undefined) {
            // Check email uniqueness excluding current user
            const exists = await userRepository.emailExistsExcluding(data.email, userId);
            if (exists) {
                const error = new Error("Email is already in use");
                error.statusCode = 409;
                throw error;
            }
            allowedFields.email = data.email;
        }

        if (Object.keys(allowedFields).length === 0) {
            const error = new Error("No valid fields to update");
            error.statusCode = 400;
            throw error;
        }

        const user = await userRepository.updateById(userId, allowedFields);
        if (!user) {
            const error = new Error("User not found");
            error.statusCode = 404;
            throw error;
        }

        return user;
    }

    async changePassword(userId, currentPassword, newPassword) {
        const user = await userRepository.findByIdWithPassword(userId);
        if (!user) {
            const error = new Error("User not found");
            error.statusCode = 404;
            throw error;
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            const error = new Error("Current password is incorrect");
            error.statusCode = 400;
            throw error;
        }

        user.password = newPassword;
        await user.save(); // triggers the pre-save hook to hash password
        return { message: "Password changed successfully" };
    }
}

module.exports = new UserService();
