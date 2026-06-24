const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },

        description: {
            type: String,
            maxlength: 2000
        },

        dueDate: {
            type: Date
        },

        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium"
        },

        tags: {
            type: [
                {
                    type: String,
                    maxlength: 30
                }
            ],
            validate: [
                {
                    validator: function (val) {
                        return val.length <= 30;
                    },
                    message: "Tags array cannot exceed 30 items"
                }
            ],
            default: []
        },

        status: {
            type: String,
            enum: ["pending", "in-progress", "completed"],
            default: "pending"
        },

        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

taskSchema.index({ owner: 1, status: 1, createdAt: -1 });
taskSchema.index({ owner: 1, dueDate: 1 });
taskSchema.index({ owner: 1, priority: 1 });
taskSchema.index({ owner: 1, tags: 1 });

module.exports = mongoose.model("Task", taskSchema);