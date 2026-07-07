const userService = require("./user.service");

class UserController {
    async getProfile(req, res, next) {
        try {
            const user = await userService.getProfile(req.user.id);
            return res.json(user);
        } catch (error) {
            return next(error);
        }
    }

    async updateProfile(req, res, next) {
        try {
            const user = await userService.updateProfile(req.user.id, req.body);
            return res.json(user);
        } catch (error) {
            return next(error);
        }
    }

    async changePassword(req, res, next) {
        try {
            const { currentPassword, newPassword } = req.body;
            const result = await userService.changePassword(
                req.user.id,
                currentPassword,
                newPassword
            );
            return res.json(result);
        } catch (error) {
            return next(error);
        }
    }
}

module.exports = new UserController();
