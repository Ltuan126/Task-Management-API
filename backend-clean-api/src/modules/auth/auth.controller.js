const authService = require("./auth.service");
const auditService = require("../audit/audit.service");

class AuthController {
    async register(req, res, next) {
        try {
            const result = await authService.register(req.body);

            // Asynchronous audit logging
            auditService.log({
                userId: result.user.id,
                email: result.user.email,
                action: "USER_REGISTERED",
                ipAddress: req.ip,
                details: { name: result.user.name },
            });

            return res.status(201).json(result);
        } catch (error) {
            return next(error);
        }
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);

            // Asynchronous audit logging
            auditService.log({
                userId: result.user.id,
                email: result.user.email,
                action: "USER_LOGGED_IN",
                ipAddress: req.ip,
            });

            return res.status(200).json(result);
        } catch (error) {
            auditService.log({
                email: req.body.email,
                action: "USER_LOGIN_FAILED",
                ipAddress: req.ip,
                details: { reason: error.message },
            });
            return next(error);
        }
    }

    async refresh(req, res, next) {
        try {
            const { refreshToken } = req.body;
            const result = await authService.refresh(refreshToken);
            return res.json(result);
        } catch (error) {
            return next(error);
        }
    }

    async logout(req, res, next) {
        try {
            const { refreshToken } = req.body;
            await authService.logout(refreshToken);

            auditService.log({
                userId: req.user.id,
                email: req.user.email,
                action: "USER_LOGGED_OUT",
                ipAddress: req.ip,
            });

            return res.json({ message: "Logged out successfully" });
        } catch (error) {
            return next(error);
        }
    }

    async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;
            const result = await authService.forgotPassword(email);

            auditService.log({
                email,
                action: "PASSWORD_RESET_REQUESTED",
                ipAddress: req.ip,
            });

            return res.json(result);
        } catch (error) {
            return next(error);
        }
    }

    async resetPassword(req, res, next) {
        try {
            const { token, newPassword } = req.body;
            const result = await authService.resetPassword(token, newPassword);

            auditService.log({
                action: "PASSWORD_RESET_COMPLETED",
                ipAddress: req.ip,
            });

            return res.json(result);
        } catch (error) {
            return next(error);
        }
    }
}

module.exports = new AuthController();
