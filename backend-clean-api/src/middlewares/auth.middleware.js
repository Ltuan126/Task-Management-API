const jwt = require("jsonwebtoken");

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
            process.env.JWT_SECRET || "dev_jwt_secret_change_me"
        );

        // Gắn user info vào request
        req.user = {
            id: decoded.userId,
        };

        next();
    } catch (error) {
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
