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
}

module.exports = new AuthController();
