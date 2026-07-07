const express = require("express");
const { body } = require("express-validator");
const authController = require("./auth.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const { authLimiter } = require("../../middlewares/rate-limit.middleware");
const { validate } = require("../../middlewares/validation.middleware");

const router = express.Router();

// Apply rate limiting to all auth routes
router.use(authLimiter);

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------
const registerValidation = [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters"),
];

router.post("/register", registerValidation, validate, authController.register);

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
const loginValidation = [
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
];

router.post("/login", loginValidation, validate, authController.login);

// ---------------------------------------------------------------------------
// Refresh Token
// ---------------------------------------------------------------------------
const refreshValidation = [
    body("refreshToken").notEmpty().withMessage("Refresh token is required"),
];

router.post("/refresh", refreshValidation, validate, authController.refresh);

// ---------------------------------------------------------------------------
// Logout (requires authentication)
// ---------------------------------------------------------------------------
router.post("/logout", authMiddleware, authController.logout);

// ---------------------------------------------------------------------------
// Forgot Password
// ---------------------------------------------------------------------------
const forgotPasswordValidation = [
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
];

router.post(
    "/forgot-password",
    forgotPasswordValidation,
    validate,
    authController.forgotPassword
);

// ---------------------------------------------------------------------------
// Reset Password
// ---------------------------------------------------------------------------
const resetPasswordValidation = [
    body("token").notEmpty().withMessage("Reset token is required"),
    body("newPassword")
        .isLength({ min: 6 })
        .withMessage("New password must be at least 6 characters"),
];

router.post(
    "/reset-password",
    resetPasswordValidation,
    validate,
    authController.resetPassword
);

module.exports = router;
