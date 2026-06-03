/**
 * Global error handling middleware.
 * Must be mounted LAST in app.js (after all routes).
 * Catches any error passed via next(err) or thrown in async handlers.
 */
// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
    // Log the full error server-side for debugging
    console.error(`[ERROR] ${req.method} ${req.path} —`, err);

    // Never leak raw stack traces to the client in production
    const statusCode = typeof err.statusCode === "number" ? err.statusCode : 500;
    const message =
        process.env.NODE_ENV === "production"
            ? statusCode === 500
                ? "Internal server error"
                : err.message
            : err.message || "Internal server error";

    return res.status(statusCode).json({ message });
};

module.exports = errorMiddleware;
