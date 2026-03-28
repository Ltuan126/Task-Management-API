const Task = require("../../models/task.model");

class TaskRepository {
    async createTask(data) {
        return await Task.create(data);
    }

    async getAllTask(userId) {
        return await Task.find({ owner: userId });
    }

    async getTaskbyId(id, userId) {
        return await Task.findOne({ _id: id, owner: userId });
    }

    async updateTask(id, data, userId) {
        return await Task.findOneAndUpdate(
            { _id: id, owner: userId },
            data,
            { new: true }
        );
    }

    async deleteTask(id, userId) {
        return await Task.findOneAndDelete({ _id: id, owner: userId });
    }
}

module.exports = new TaskRepository();
