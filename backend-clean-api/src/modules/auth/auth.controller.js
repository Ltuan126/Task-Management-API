const { validationResult } = require("express-validator");
const authService = require("./auth.service");
const auditService = require("../audit/audit.service");

const sendValidationErrors = (req, res) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
        return null;
    }

    return res.status(400).json({
        message: "Validation failed",
        errors: errors.array(),
    });
};

class AuthController {
    async register(req, res) {
        try {
            const validationResponse = sendValidationErrors(req, res);
            if (validationResponse) return validationResponse;

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
            return res.status(error.statusCode || 500).json({
                message: error.message || "Internal server error",
            });
        }
    }

    async login(req, res) {
        try {
            const validationResponse = sendValidationErrors(req, res);
            if (validationResponse) return validationResponse;

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
            return res.status(error.statusCode || 500).json({
                message: error.message || "Internal server error",
            });
        }
    }
}

module.exports = new AuthController();
