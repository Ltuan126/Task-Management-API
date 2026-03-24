const jwt = require("jsonwebtoken");
const authRepository = require("./auth.repository");

class AuthService {
    generateToken(userId) {
        return jwt.sign(
            { userId },
            process.env.JWT_SECRET || "dev_jwt_secret_change_me",
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
        const token = this.generateToken(user._id.toString());

        return {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
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

        const token = this.generateToken(user._id.toString());

        return {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
            token,
        };
    }
}

module.exports = new AuthService();
