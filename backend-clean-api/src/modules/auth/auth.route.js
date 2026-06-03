const express = require("express");
const { body } = require("express-validator");
const authController = require("./auth.controller");
const { authLimiter } = require("../../middlewares/rate-limit.middleware");

const router = express.Router();

// Apply rate limiting to all auth routes
router.use(authLimiter);

const registerValidation = [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters"),
];

const loginValidation = [
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
];

router.post("/register", registerValidation, authController.register);
router.post("/login", loginValidation, authController.login);

module.exports = router;
