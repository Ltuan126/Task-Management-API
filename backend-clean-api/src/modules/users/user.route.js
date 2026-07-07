const express = require("express");
const { body } = require("express-validator");
const userController = require("./user.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const { validate } = require("../../middlewares/validation.middleware");

const router = express.Router();

// All user routes require authentication
router.use(authMiddleware);

// GET /api/users/me — get current user profile
router.get("/me", userController.getProfile);

// PUT /api/users/me — update profile (name, email)
const updateProfileValidation = [
    body("name")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Name cannot be empty"),
    body("email")
        .optional()
        .isEmail()
        .withMessage("Valid email is required")
        .normalizeEmail(),
];
router.put("/me", updateProfileValidation, validate, userController.updateProfile);

// PUT /api/users/me/password — change password
const changePasswordValidation = [
    body("currentPassword")
        .notEmpty()
        .withMessage("Current password is required"),
    body("newPassword")
        .isLength({ min: 6 })
        .withMessage("New password must be at least 6 characters"),
];
router.put(
    "/me/password",
    changePasswordValidation,
    validate,
    userController.changePassword
);

module.exports = router;
