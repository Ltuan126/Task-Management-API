const Task = require("../../models/task.model");

// Fields that clients are permitted to update.
// Any other fields in the request body (e.g. owner, _id) are silently ignored.
const UPDATABLE_FIELDS = ["title", "description", "status", "priority", "dueDate", "tags"];

class TaskRepository {
    async createTask(data) {
        return await Task.create(data);
    }

    async getAllTask(user, options = {}) {
        const {
            page = 1,
            limit = 10,
            status,
            priority,
            q,
            dueDateFrom,
            dueDateTo,
            sortBy = "createdAt",
            sortOrder = "desc",
            owner,
        } = options;

        const filter = {};
        if (user.role !== "admin") {
            filter.owner = user.id;
        } else if (owner) {
            filter.owner = owner;
        }

        if (status) {
            filter.status = status;
        }

        if (priority) {
            filter.priority = priority;
        }

        if (q) {
            filter.$or = [
                { title: { $regex: q, $options: "i" } },
                { description: { $regex: q, $options: "i" } },
            ];
        }

        if (dueDateFrom || dueDateTo) {
            filter.dueDate = {};

            if (dueDateFrom) {
                filter.dueDate.$gte = dueDateFrom;
            }

            if (dueDateTo) {
                filter.dueDate.$lte = dueDateTo;
            }

            if (Object.keys(filter.dueDate).length === 0) {
                delete filter.dueDate;
            }
        }

        const skip = (page - 1) * limit;
        const sort = {
            [sortBy]: sortOrder === "asc" ? 1 : -1,
        };

        const [items, total] = await Promise.all([
            Task.find(filter).sort(sort).skip(skip).limit(limit),
            Task.countDocuments(filter),
        ]);

        return {
            items,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1,
            },
        };
    }

    async getTaskbyId(id, user) {
        const query = { _id: id };
        if (user.role !== "admin") {
            query.owner = user.id;
        }
        return await Task.findOne(query);
    }

    async updateTask(id, data, user) {
        // Only pick explicitly allowed fields — protects against mass assignment attacks
        const safeData = Object.fromEntries(
            Object.entries(data).filter(([key]) => UPDATABLE_FIELDS.includes(key))
        );

        const query = { _id: id };
        if (user.role !== "admin") {
            query.owner = user.id;
        }

        return await Task.findOneAndUpdate(
            query,
            safeData,
            { returnDocument: "after", runValidators: true }
        );
    }

    async deleteTask(id, user) {
        const query = { _id: id };
        if (user.role !== "admin") {
            query.owner = user.id;
        }
        return await Task.findOneAndDelete(query);
    }

    async getStats(user) {
        const query = {};
        if (user.role !== "admin") {
            query.owner = user.id;
        }

        const [pending, inProgress, completed] = await Promise.all([
            Task.countDocuments({ ...query, status: "pending" }),
            Task.countDocuments({ ...query, status: "in-progress" }),
            Task.countDocuments({ ...query, status: "completed" }),
        ]);

        return {
            total: pending + inProgress + completed,
            pending,
            inProgress,
            completed,
        };
    }
}

module.exports = new TaskRepository();

