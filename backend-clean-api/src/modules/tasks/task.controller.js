const mongoose = require("mongoose");
const taskService = require("./task.service");

const isInvalidObjectId = (id) => !mongoose.Types.ObjectId.isValid(id);

const handleTaskError = (res, error) => {
    if (error.name === "ValidationError") {
        return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Internal server error" });
};

class TaskController {
    async createTask(req, res) {
        try {
            const task = await taskService.createTask(req.body);
            return res.status(201).json(task);
        } catch (error) {
            return handleTaskError(res, error);
        }
    }

    async getTasks(req, res) {
        try {
            const tasks = await taskService.getTasks();
            return res.json(tasks);
        } catch (error) {
            return handleTaskError(res, error);
        }
    }

    async getTask(req, res) {
        try {
            if (isInvalidObjectId(req.params.id)) {
                return res.status(400).json({ message: "Invalid task id" });
            }

            const task = await taskService.getTask(req.params.id);

            if (!task) {
                return res.status(404).json({ message: "Task not found" });
            }

            return res.json(task);
        } catch (error) {
            return handleTaskError(res, error);
        }
    }

    async updateTask(req, res) {
        try {
            if (isInvalidObjectId(req.params.id)) {
                return res.status(400).json({ message: "Invalid task id" });
            }

            const task = await taskService.updateTask(req.params.id, req.body);

            if (!task) {
                return res.status(404).json({ message: "Task not found" });
            }

            return res.json(task);
        } catch (error) {
            return handleTaskError(res, error);
        }
    }

    async deleteTask(req, res) {
        try {
            if (isInvalidObjectId(req.params.id)) {
                return res.status(400).json({ message: "Invalid task id" });
            }

            const task = await taskService.deleteTask(req.params.id);

            if (!task) {
                return res.status(404).json({ message: "Task not found" });
            }

            return res.json({ message: "Task deleted" });
        } catch (error) {
            return handleTaskError(res, error);
        }
    }
}

module.exports = new TaskController();