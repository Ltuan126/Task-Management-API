const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../config/jwt");

const authMiddleware = (req, res, next) => {
    try {
        // Lấy token từ header Authorization: Bearer <token>
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Authorization header missing or invalid format",
            });
        }

        // Tách token từ "Bearer <token>"
        const token = authHeader.slice(7);

        // Verify JWT
        const decoded = jwt.verify(
            token,
            getJwtSecret()
        );

        // Gắn user info vào request
        req.user = {
            id: decoded.userId,
            role: decoded.role || "user",
            email: decoded.email,
        };

        next();
    } catch (error) {
        if (error.message === "JWT_SECRET is not configured") {
            return res.status(500).json({
                message: "Server misconfiguration",
            });
        }

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Token expired",
            });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                message: "Invalid token",
            });
        }

        return res.status(401).json({
            message: "Unauthorized",
        });
    }
};

module.exports = authMiddleware;
