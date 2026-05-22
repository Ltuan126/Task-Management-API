const express = require("express");
const app = express();
const { swaggerSpec, swaggerMiddleware } = require("./config/swagger");
// Manual CORS - Express 5 intercepts OPTIONS before cors middleware
app.options("*", (req, res) => {
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    res.status(204).end();
});

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
});

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

app.get("/api-docs.json", (req, res) => {
    res.status(200).json(swaggerSpec);
});

app.use("/api-docs", ...swaggerMiddleware);

const taskRoutes = require("./modules/tasks/task.route");
const authRoutes = require("./modules/auth/auth.route");

app.use("/api/tasks", taskRoutes);
app.use("/api/auth", authRoutes);
module.exports = app;