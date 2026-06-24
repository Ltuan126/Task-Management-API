const express = require("express");
const { body, query } = require("express-validator");
const router = express.Router();
const taskController = require("./task.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const { validate } = require("../../middlewares/validation.middleware");

const listTasksValidation = [
	query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer"),
	query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be between 1 and 100"),
	query("status")
		.optional()
		.isIn(["pending", "in-progress", "completed"])
		.withMessage("status must be one of: pending, in-progress, completed"),
	query("priority")
		.optional()
		.isIn(["low", "medium", "high"])
		.withMessage("priority must be one of: low, medium, high"),
	query("sortBy")
		.optional()
		.isIn(["createdAt", "updatedAt", "title", "status", "dueDate"])
		.withMessage("sortBy must be one of: createdAt, updatedAt, title, status, dueDate"),
	query("sortOrder")
		.optional()
		.isIn(["asc", "desc"])
		.withMessage("sortOrder must be one of: asc, desc"),
	query("dueDateFrom").optional().isISO8601().withMessage("dueDateFrom must be a valid ISO date"),
	query("dueDateTo").optional().isISO8601().withMessage("dueDateTo must be a valid ISO date"),
];

const createTaskValidation = [
	body("title")
		.trim()
		.notEmpty().withMessage("title is required")
		.isLength({ max: 100 }).withMessage("title cannot exceed 100 characters"),
	body("description")
		.optional()
		.isLength({ max: 2000 }).withMessage("description cannot exceed 2000 characters"),
	body("status")
		.optional()
		.isIn(["pending", "in-progress", "completed"])
		.withMessage("status must be one of: pending, in-progress, completed"),
	body("priority")
		.optional()
		.isIn(["low", "medium", "high"])
		.withMessage("priority must be one of: low, medium, high"),
	body("dueDate").optional().isISO8601().withMessage("dueDate must be a valid ISO date"),
	body("tags")
		.optional()
		.isArray().withMessage("tags must be an array")
		.custom((val) => val.length <= 30).withMessage("tags cannot exceed 30 items"),
	body("tags.*")
		.optional()
		.isString().withMessage("each tag must be a string")
		.isLength({ max: 30 }).withMessage("each tag cannot exceed 30 characters"),
];

const updateTaskValidation = [
	body("title")
		.optional()
		.trim()
		.notEmpty().withMessage("title cannot be empty")
		.isLength({ max: 100 }).withMessage("title cannot exceed 100 characters"),
	body("description")
		.optional()
		.isLength({ max: 2000 }).withMessage("description cannot exceed 2000 characters"),
	body("status")
		.optional()
		.isIn(["pending", "in-progress", "completed"])
		.withMessage("status must be one of: pending, in-progress, completed"),
	body("priority")
		.optional()
		.isIn(["low", "medium", "high"])
		.withMessage("priority must be one of: low, medium, high"),
	body("dueDate").optional().isISO8601().withMessage("dueDate must be a valid ISO date"),
	body("tags")
		.optional()
		.isArray().withMessage("tags must be an array")
		.custom((val) => val.length <= 30).withMessage("tags cannot exceed 30 items"),
	body("tags.*")
		.optional()
		.isString().withMessage("each tag must be a string")
		.isLength({ max: 30 }).withMessage("each tag cannot exceed 30 characters"),
];

// Apply auth middleware to all task routes
router.use(authMiddleware);

router.get("/stats", taskController.getStats);
router.get("/analytics", taskController.getAnalytics);
router.get("/", listTasksValidation, validate, taskController.getTasks);
router.get("/:id", taskController.getTask);
router.post("/", createTaskValidation, validate, taskController.createTask);
router.put("/:id", updateTaskValidation, validate, taskController.updateTask);
router.delete("/:id", taskController.deleteTask);

module.exports = router;