const taskRepository = require("./task.repository");

class TaskService {
    async createTask(data, userId) {
        return await taskRepository.createTask({ ...data, owner: userId });
    }

    async getTasks(userId) {
        return await taskRepository.getAllTask(userId);
    }

    async getTask(id, userId) {
        return await taskRepository.getTaskbyId(id, userId);
    }

    async updateTask(id, data, userId) {
        return await taskRepository.updateTask(id, data, userId);
    }

    async deleteTask(id, userId) {
        return await taskRepository.deleteTask(id, userId);
    }

}

module.exports = new TaskService();