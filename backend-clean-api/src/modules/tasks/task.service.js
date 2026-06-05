const taskRepository = require("./task.repository");

const toPositiveInt = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
        return fallback;
    }

    return parsed;
};

const ALLOWED_SORT_FIELDS = new Set(["createdAt", "updatedAt", "title", "status", "dueDate"]);

const parseDateOrNull = (value) => {
    if (typeof value !== "string" || !value.trim()) {
        return null;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    return parsed;
};

class TaskService {
    async createTask(data, userId) {
        return await taskRepository.createTask({ ...data, owner: userId });
    }

    async getTasks(userId, query = {}) {
        const page = toPositiveInt(query.page, 1);
        const limit = Math.min(toPositiveInt(query.limit, 10), 100);
        const status = query.status;
        const priority = query.priority;
        const q = typeof query.q === "string" ? query.q.trim() : "";
        const dueDateFrom = parseDateOrNull(query.dueDateFrom);
        const dueDateTo = parseDateOrNull(query.dueDateTo);

        const sortBy = ALLOWED_SORT_FIELDS.has(query.sortBy)
            ? query.sortBy
            : "createdAt";
        const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

        return await taskRepository.getAllTask(userId, {
            page,
            limit,
            status,
            priority,
            q,
            dueDateFrom,
            dueDateTo,
            sortBy,
            sortOrder,
        });
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

    async getStats(userId) {
        return await taskRepository.getStats(userId);
    }

}

module.exports = new TaskService();