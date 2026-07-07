const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const authRepository = require("./auth.repository");
const { getJwtSecret } = require("../../config/jwt");
const RefreshToken = require("../../models/refresh-token.model");
const User = require("../../models/user.model");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** SHA-256 hash — used for refresh tokens and password reset tokens */
const hashToken = (token) =>
    crypto.createHash("sha256").update(token).digest("hex");

/** Refresh token lifespan in days */
const REFRESH_TOKEN_DAYS = 7;

/** Password reset token lifespan in milliseconds (1 hour) */
const RESET_TOKEN_MS = 60 * 60 * 1000;

class AuthService {
    /**
     * Generate a short-lived JWT access token.
     */
    generateAccessToken(userId, role, email) {
        return jwt.sign(
            { userId, role, email },
            getJwtSecret(),
            { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
        );
    }

    /**
     * Generate a cryptographically random refresh token, store its hash in DB,
     * and return the raw token to be sent to the client.
     */
    async generateRefreshToken(userId) {
        const raw = crypto.randomBytes(40).toString("hex");
        const hashed = hashToken(raw);

        const expiresAt = new Date(
            Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000
        );

        await RefreshToken.create({
            token: hashed,
            userId,
            expiresAt,
        });

        return raw;
    }

    // -----------------------------------------------------------------------
    // Register
    // -----------------------------------------------------------------------
    async register(data) {
        const existingUser = await authRepository.existsByEmail(data.email);

        if (existingUser) {
            const error = new Error("Email already exists");
            error.statusCode = 409;
            throw error;
        }

        const user = await authRepository.createUser(data);
        const token = this.generateAccessToken(user._id.toString(), user.role, user.email);
        const refreshToken = await this.generateRefreshToken(user._id.toString());

        return {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            token,
            refreshToken,
        };
    }

    // -----------------------------------------------------------------------
    // Login
    // -----------------------------------------------------------------------
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

        const token = this.generateAccessToken(user._id.toString(), user.role, user.email);
        const refreshToken = await this.generateRefreshToken(user._id.toString());

        return {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            token,
            refreshToken,
        };
    }

    // -----------------------------------------------------------------------
    // Refresh — rotate: invalidate old token, issue new pair
    // -----------------------------------------------------------------------
    async refresh(rawRefreshToken) {
        if (!rawRefreshToken) {
            const error = new Error("Refresh token is required");
            error.statusCode = 400;
            throw error;
        }

        const hashed = hashToken(rawRefreshToken);

        // Find and delete in one atomic operation (rotation)
        const storedToken = await RefreshToken.findOneAndDelete({ token: hashed });

        if (!storedToken) {
            const error = new Error("Invalid refresh token");
            error.statusCode = 401;
            throw error;
        }

        // Check expiry
        if (storedToken.expiresAt < new Date()) {
            const error = new Error("Refresh token expired");
            error.statusCode = 401;
            throw error;
        }

        // Fetch user to get current role/email for the new access token
        const user = await User.findById(storedToken.userId);
        if (!user) {
            const error = new Error("User not found");
            error.statusCode = 401;
            throw error;
        }

        // Issue new pair
        const newAccessToken = this.generateAccessToken(
            user._id.toString(),
            user.role,
            user.email
        );
        const newRefreshToken = await this.generateRefreshToken(user._id.toString());

        return {
            token: newAccessToken,
            refreshToken: newRefreshToken,
        };
    }

    // -----------------------------------------------------------------------
    // Logout — invalidate a single refresh token
    // -----------------------------------------------------------------------
    async logout(rawRefreshToken) {
        if (!rawRefreshToken) {
            return; // silently succeed — idempotent
        }

        const hashed = hashToken(rawRefreshToken);
        await RefreshToken.deleteOne({ token: hashed });
    }

    // -----------------------------------------------------------------------
    // Logout All — invalidate all refresh tokens for a user
    // -----------------------------------------------------------------------
    async logoutAll(userId) {
        await RefreshToken.deleteMany({ userId });
    }

    // -----------------------------------------------------------------------
    // Forgot Password — generate a reset token
    // -----------------------------------------------------------------------
    async forgotPassword(email) {
        const user = await User.findOne({ email });

        // Always return success to prevent email enumeration
        if (!user) {
            return { message: "If the email exists, a reset token has been generated" };
        }

        const rawToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = hashToken(rawToken);

        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_MS);
        await user.save({ validateModifiedOnly: true });

        // In production, you would send this token via email.
        // For now, return it in the response for development/testing.
        return {
            message: "If the email exists, a reset token has been generated",
            resetToken: rawToken,
        };
    }

    // -----------------------------------------------------------------------
    // Reset Password — verify token and set new password
    // -----------------------------------------------------------------------
    async resetPassword(rawToken, newPassword) {
        if (!rawToken || !newPassword) {
            const error = new Error("Token and new password are required");
            error.statusCode = 400;
            throw error;
        }

        const hashedToken = hashToken(rawToken);

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: new Date() },
        }).select("+passwordResetToken +passwordResetExpires");

        if (!user) {
            const error = new Error("Invalid or expired reset token");
            error.statusCode = 400;
            throw error;
        }

        user.password = newPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        // Invalidate all existing refresh tokens (security: force re-login)
        await RefreshToken.deleteMany({ userId: user._id });

        return { message: "Password reset successfully" };
    }
}

module.exports = new AuthService();
