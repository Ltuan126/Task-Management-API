const express = require("express");
const app = express();
const cors = require("cors");
const morgan = require("morgan");
const { swaggerSpec, swaggerMiddleware } = require("./config/swagger");
const errorMiddleware = require("./middlewares/error.middleware");

// ---------------------------------------------------------------------------
// CORS — only allow origins listed in ALLOWED_ORIGINS env var.
// Multiple origins can be separated by commas:
//   ALLOWED_ORIGINS=https://myapp.com,https://staging.myapp.com
// Falls back to localhost:5173 for local development.
// ---------------------------------------------------------------------------
const rawOrigins = process.env.ALLOWED_ORIGINS || "http://localhost:5173";
const allowedOrigins = new Set(
    rawOrigins.split(",").map((o) => o.trim()).filter(Boolean)
);

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, Swagger UI on same host)
        if (!origin || allowedOrigins.has(origin)) {
            return callback(null, true);
        }
        return callback(
            Object.assign(new Error(`CORS: origin '${origin}' is not allowed`), {
                statusCode: 403,
            })
        );
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// ---------------------------------------------------------------------------
// Request logging — skip in test environment to keep test output clean
// ---------------------------------------------------------------------------
if (process.env.NODE_ENV !== "test") {
    app.use(morgan("dev"));
}

app.use(express.json());

// Route test
app.get("/", (req, res) => {
    res.send("Task Management API is working");
});

// Health check
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "Server is healthy",
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

// ---------------------------------------------------------------------------
// Global error handler — must be registered AFTER all routes
// ---------------------------------------------------------------------------
app.use(errorMiddleware);

module.exports = app;