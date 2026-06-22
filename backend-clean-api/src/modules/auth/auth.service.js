const jwt = require("jsonwebtoken");
const authRepository = require("./auth.repository");
const { getJwtSecret } = require("../../config/jwt");

class AuthService {
    generateToken(userId, role, email) {
        return jwt.sign(
            { userId, role, email },
            getJwtSecret(),
            { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
        );
    }

    async register(data) {
        const existingUser = await authRepository.existsByEmail(data.email);

        if (existingUser) {
            const error = new Error("Email already exists");
            error.statusCode = 409;
            throw error;
        }

        const user = await authRepository.createUser(data);
        const token = this.generateToken(user._id.toString(), user.role, user.email);

        return {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            token,
        };
    }

    async login(email, password) {
        const user = await authRepository.findUserByEmail(email);

        if (!user) {
            const error = new Error("Invalid email or password");
            error.statusCode = 401;
            throw error;
        }

        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            const error = new Error("Invalid email or password");
            error.statusCode = 401;
            throw error;
        }

        const token = this.generateToken(user._id.toString(), user.role, user.email);

        return {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            token,
        };
    }
}

module.exports = new AuthService();
