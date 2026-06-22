const mongoose = require("mongoose");
const taskService = require("./task.service");
const auditService = require("../audit/audit.service");

const isInvalidObjectId = (id) => !mongoose.Types.ObjectId.isValid(id);

const handleTaskError = (res, next, error) => {
    if (error.name === "ValidationError") {
        return res.status(400).json({ message: error.message });
    }
    return next(error);
};

class TaskController {
    async createTask(req, res, next) {
        try {
            const user = req.user;
            const task = await taskService.createTask(req.body, user);

            auditService.log({
                userId: user.id,
                email: user.email,
                action: "TASK_CREATED",
                ipAddress: req.ip,
                details: { taskId: task._id, title: task.title, priority: task.priority },
            });

            return res.status(201).json(task);
        } catch (error) {
            return handleTaskError(res, next, error);
        }
    }

    async getTasks(req, res, next) {
        try {
            const user = req.user;
            const tasks = await taskService.getTasks(user, req.query);
            return res.json(tasks);
        } catch (error) {
            return handleTaskError(res, next, error);
        }
    }

    async getTask(req, res, next) {
        try {
            if (isInvalidObjectId(req.params.id)) {
                return res.status(400).json({ message: "Invalid task id" });
            }

            const user = req.user;
            const task = await taskService.getTask(req.params.id, user);

            if (!task) {
                return res.status(404).json({ message: "Task not found" });
            }

            return res.json(task);
        } catch (error) {
            return handleTaskError(res, next, error);
        }
    }

    async updateTask(req, res, next) {
        try {
            if (isInvalidObjectId(req.params.id)) {
                return res.status(400).json({ message: "Invalid task id" });
            }

            const user = req.user;
            const task = await taskService.updateTask(req.params.id, req.body, user);

            if (!task) {
                return res.status(404).json({ message: "Task not found" });
            }

            auditService.log({
                userId: user.id,
                email: user.email,
                action: "TASK_UPDATED",
                ipAddress: req.ip,
                details: { taskId: task._id, title: task.title, updates: Object.keys(req.body) },
            });

            return res.json(task);
        } catch (error) {
            return handleTaskError(res, next, error);
        }
    }

    async deleteTask(req, res, next) {
        try {
            if (isInvalidObjectId(req.params.id)) {
                return res.status(400).json({ message: "Invalid task id" });
            }

            const user = req.user;
            const task = await taskService.deleteTask(req.params.id, user);

            if (!task) {
                return res.status(404).json({ message: "Task not found" });
            }

            auditService.log({
                userId: user.id,
                email: user.email,
                action: "TASK_DELETED",
                ipAddress: req.ip,
                details: { taskId: task._id, title: task.title },
            });

            return res.json({ message: "Task deleted" });
        } catch (error) {
            return handleTaskError(res, next, error);
        }
    }

    async getStats(req, res, next) {
        try {
            const user = req.user;
            const stats = await taskService.getStats(user);
            return res.json(stats);
        } catch (error) {
            return handleTaskError(res, next, error);
        }
    }

    async getAnalytics(req, res, next) {
        try {
            const user = req.user;
            const analytics = await taskService.getAnalytics(user);
            return res.json(analytics);
        } catch (error) {
            return handleTaskError(res, next, error);
        }
    }
}

module.exports = new TaskController();