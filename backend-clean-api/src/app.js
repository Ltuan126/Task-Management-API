const express = require("express");
const app = express();

app.use(express.json());

// route test
app.get("/", (req, res) => {
    res.send("Task Management API is working");
});

// health check
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "Server is healthy"
    });
});

const taskRoutes = require("./modules/tasks/task.route");

app.use("/api/tasks", taskRoutes)
module.exports = app;