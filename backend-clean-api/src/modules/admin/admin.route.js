const express = require("express");
const adminController = require("./admin.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/role.middleware");

const router = express.Router();

// Apply authentication and admin role requirement to all admin routes
router.use(authMiddleware);
router.use(requireRole("admin"));

router.get("/users", adminController.getAllUsers);
router.patch("/users/:id/role", adminController.updateUserRole);

module.exports = router;
