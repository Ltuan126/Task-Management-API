const Task = require("../../models/task.model");

class TaskRepository {
    async createTask(data) {
        return await Task.create(data);
    }

    async getAllTask(userId, options = {}) {
        const {
            page = 1,
            limit = 10,
            status,
            q,
            sortBy = "createdAt",
            sortOrder = "desc",
        } = options;

        const filter = { owner: userId };

        if (status) {
            filter.status = status;
        }

        if (q) {
            filter.$or = [
                { title: { $regex: q, $options: "i" } },
                { description: { $regex: q, $options: "i" } },
            ];
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
