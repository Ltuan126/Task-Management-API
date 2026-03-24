const { validationResult } = require("express-validator");
const authService = require("./auth.service");

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
            return res.status(200).json(result);
        } catch (error) {
            return res.status(error.statusCode || 500).json({
                message: error.message || "Internal server error",
            });
        }
    }
}

module.exports = new AuthController();
