const express = require("express");
const router = express.Router();
const taskController = require("./task.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

// Apply auth middleware to all task routes
router.use(authMiddleware);

router.get("/", taskController.getTasks);
router.get("/:id", taskController.getTask);
router.post("/", taskController.createTask);
router.put("/:id", taskController.updateTask);
router.delete("/:id", taskController.deleteTask);

module.exports = router;