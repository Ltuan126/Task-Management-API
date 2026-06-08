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
    async createTask(data, user) {
        return await taskRepository.createTask({ ...data, owner: user.id });
    }

    async getTasks(user, query = {}) {
        const page = toPositiveInt(query.page, 1);
        const limit = Math.min(toPositiveInt(query.limit, 10), 100);
        const status = query.status;
        const priority = query.priority;
        const q = typeof query.q === "string" ? query.q.trim() : "";
        const dueDateFrom = parseDateOrNull(query.dueDateFrom);
        const dueDateTo = parseDateOrNull(query.dueDateTo);
        const owner = query.owner;

        const sortBy = ALLOWED_SORT_FIELDS.has(query.sortBy)
            ? query.sortBy
            : "createdAt";
        const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

        return await taskRepository.getAllTask(user, {
            page,
            limit,
            status,
            priority,
            q,
            dueDateFrom,
            dueDateTo,
            sortBy,
            sortOrder,
            owner,
        });
    }

    async getTask(id, user) {
        return await taskRepository.getTaskbyId(id, user);
    }

    async updateTask(id, data, user) {
        return await taskRepository.updateTask(id, data, user);
    }

    async deleteTask(id, user) {
        return await taskRepository.deleteTask(id, user);
    }

    async getStats(user) {
        return await taskRepository.getStats(user);
    }

    async getAnalytics(user) {
        return await taskRepository.getAnalytics(user);
    }
}

module.exports = new TaskService();