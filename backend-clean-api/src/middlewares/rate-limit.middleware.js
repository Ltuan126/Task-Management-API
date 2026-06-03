const rateLimit = require("express-rate-limit");

/**
 * Rate limiter for auth routes (/api/auth/login, /api/auth/register).
 * Disabled in test environment to avoid flaky tests.
 * Limit: 10 requests per 15 minutes per IP.
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === "test",
    message: {
        message: "Too many requests from this IP, please try again after 15 minutes",
    },
});

module.exports = { authLimiter };
