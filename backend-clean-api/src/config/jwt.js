/**
 * Returns the JWT_SECRET env var, throwing clearly if it is not configured.
 * Single source of truth — imported by auth.service.js and auth.middleware.js.
 *
 * @returns {string} The JWT secret string
 */
const getJwtSecret = () => {
    if (!process.env.JWT_SECRET) {
        const error = new Error("JWT_SECRET is not configured");
        error.statusCode = 500;
        throw error;
    }

    return process.env.JWT_SECRET;
};

module.exports = { getJwtSecret };
