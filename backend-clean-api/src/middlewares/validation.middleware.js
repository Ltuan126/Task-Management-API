const { validationResult } = require("express-validator");

/**
 * Express middleware that checks for validation errors produced by
 * express-validator rules. If there are errors it responds immediately
 * with 400 and the structured error list; otherwise it calls next().
 *
 * Usage: add as the last middleware in a validation chain before the
 * controller handler, e.g.:
 *   router.post("/", [...validators, validate], controller.create)
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
        return next();
    }

    return res.status(400).json({
        message: "Validation failed",
        errors: errors.array(),
    });
};

module.exports = { validate };
