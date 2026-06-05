const express = require("express");
const { body, query } = require("express-validator");
const router = express.Router();
const taskController = require("./task.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

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
	body("title").trim().notEmpty().withMessage("title is required"),
	body("status")
		.optional()
		.isIn(["pending", "in-progress", "completed"])
		.withMessage("status must be one of: pending, in-progress, completed"),
	body("priority")
		.optional()
		.isIn(["low", "medium", "high"])
		.withMessage("priority must be one of: low, medium, high"),
	body("dueDate").optional().isISO8601().withMessage("dueDate must be a valid ISO date"),
	body("tags").optional().isArray().withMessage("tags must be an array"),
	body("tags.*").optional().isString().withMessage("each tag must be a string"),
];

const updateTaskValidation = [
	body("title").optional().trim().notEmpty().withMessage("title cannot be empty"),
	body("status")
		.optional()
		.isIn(["pending", "in-progress", "completed"])
		.withMessage("status must be one of: pending, in-progress, completed"),
	body("priority")
		.optional()
		.isIn(["low", "medium", "high"])
		.withMessage("priority must be one of: low, medium, high"),
	body("dueDate").optional().isISO8601().withMessage("dueDate must be a valid ISO date"),
	body("tags").optional().isArray().withMessage("tags must be an array"),
	body("tags.*").optional().isString().withMessage("each tag must be a string"),
];

// Apply auth middleware to all task routes
router.use(authMiddleware);

router.get("/stats", taskController.getStats);
router.get("/", listTasksValidation, taskController.getTasks);
router.get("/:id", taskController.getTask);
router.post("/", createTaskValidation, taskController.createTask);
router.put("/:id", updateTaskValidation, taskController.updateTask);
router.delete("/:id", taskController.deleteTask);

module.exports = router;