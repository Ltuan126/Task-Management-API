const taskRepository = require("./task.repository");

class TaskService {
    async creataTask(data) {
        return await taskRepository.createTask(data);
    }

    async getTasks() {
        return await taskRepository.getAllTask();
    }

    async getTask(id) {
        return await taskRepository.getTaskbyId(id);
    }

    async updateTask(id, data) {
        return await taskRepository.updateTask(id, data);
    }

    async deleteTask(id) {
        return await taskRepository.deleteTask(id);
    }

}

module.exports = new TaskService();