const express = require("express");
const app = express();
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const { swaggerSpec, swaggerMiddleware } = require("./config/swagger");
const errorMiddleware = require("./middlewares/error.middleware");

// ---------------------------------------------------------------------------
// Security — HTTP headers hardening via helmet
// ---------------------------------------------------------------------------
app.use(helmet());

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

// ---------------------------------------------------------------------------
// Body parsing — limit payload size to prevent DoS via large requests
// ---------------------------------------------------------------------------
app.use(express.json({ limit: "10kb" }));

// ---------------------------------------------------------------------------
// NoSQL injection prevention — strips $ and . from req.body/query/params
// ---------------------------------------------------------------------------
// Express 5 query getter workaround for express-mongo-sanitize
app.use((req, res, next) => {
    if (req.query) {
        Object.defineProperty(req, 'query', {
            value: { ...req.query },
            writable: true,
            configurable: true,
            enumerable: true,
        });
    }
    next();
});
app.use(mongoSanitize());

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
const adminRoutes = require("./modules/admin/admin.route");
const auditRoutes = require("./modules/audit/audit.route");
const userRoutes = require("./modules/users/user.route");

app.use("/api/tasks", taskRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/users", userRoutes);

// ---------------------------------------------------------------------------
// 404 handler for unmatched routes
// ---------------------------------------------------------------------------
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
});

// ---------------------------------------------------------------------------
// Global error handler — must be registered AFTER all routes
// ---------------------------------------------------------------------------
app.use(errorMiddleware);

module.exports = app;