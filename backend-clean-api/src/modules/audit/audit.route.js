const express = require("express");
const auditController = require("./audit.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/role.middleware");

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole("admin"));

router.get("/", auditController.getAuditLogs);

module.exports = router;
