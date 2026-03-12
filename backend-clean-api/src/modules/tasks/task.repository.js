const Task = require("../../models/task.model");

class TaskRepository {
    async createTask(data) {
        return await Task.create(data);
    }

    async getAllTask(data) {
        return await Task.find();
    }

    async getTaskbyId(id) {
        return await Task.findById(id);
    }

    async updateTask(id, data) {
        return await Task.findByIdAndUpdate(id, data, { new: true });
    }

    async deleteTask(id) {
        return await Task.findByIdAndDelete(id);
    }
}

module.exports = new TaskRepository();
