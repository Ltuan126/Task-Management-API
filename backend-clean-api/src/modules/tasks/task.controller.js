const taskService = require("./task.service");

class TaskController {
    async createTask(req, res) {
        const task = await taskService.creataTask(req.body);
        res.status(201).json(task);
    }

    async getTasks(req, res) {
        const tasks = await taskService.getTasks();
        res.json(tasks);
    }

    async getTask(req, res) {
        const task = await taskService.getTask(req.params.id)
        res.json(task);
    }

    async updateTask(req, res) {
        const task = await taskService.updateTask(req.params.id, req.body)
        res.json(task);
    }

    async deleteTask(req, res) {
        const task = await taskService.deleteTask(req.params.id)
        res.json({ message: "Task deleted" });
    }
}

module.exports = new TaskController();