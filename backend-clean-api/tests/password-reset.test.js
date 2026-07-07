const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

process.env.JWT_EXPIRES_IN = "1h";
process.env.NODE_ENV = "test";

const app = require("../src/app");
const User = require("../src/models/user.model");

describe("Password Reset API", () => {
    let mongoServer;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);
    });

    afterEach(async () => {
        await mongoose.connection.db.dropDatabase();
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    // Helper
    const registerUser = async (overrides = {}) => {
        const payload = {
            name: "Reset User",
            email: "reset@example.com",
            password: "oldpassword123",
            ...overrides,
        };
        const res = await request(app).post("/api/auth/register").send(payload);
        expect(res.status).toBe(201);
        return res.body;
    };

    // -----------------------------------------------------------------------
    // Forgot Password
    // -----------------------------------------------------------------------

    it("POST /api/auth/forgot-password with valid email returns reset token", async () => {
        await registerUser();

        const res = await request(app)
            .post("/api/auth/forgot-password")
            .send({ email: "reset@example.com" });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("resetToken");
        expect(typeof res.body.resetToken).toBe("string");
        expect(res.body.resetToken.length).toBeGreaterThan(0);
    });

    it("POST /api/auth/forgot-password with unknown email returns 200 (no leak)", async () => {
        const res = await request(app)
            .post("/api/auth/forgot-password")
            .send({ email: "unknown@example.com" });

        // Should NOT reveal that the email doesn't exist
        expect(res.status).toBe(200);
        expect(res.body.message).toBeDefined();
    });

    it("POST /api/auth/forgot-password with invalid email format returns 400", async () => {
        const res = await request(app)
            .post("/api/auth/forgot-password")
            .send({ email: "not-an-email" });

        expect(res.status).toBe(400);
    });

    // -----------------------------------------------------------------------
    // Reset Password
    // -----------------------------------------------------------------------

    it("POST /api/auth/reset-password with valid token resets password", async () => {
        await registerUser({ email: "valid-reset@example.com" });

        // Request reset token
        const forgotRes = await request(app)
            .post("/api/auth/forgot-password")
            .send({ email: "valid-reset@example.com" });

        const { resetToken } = forgotRes.body;

        // Reset the password
        const resetRes = await request(app)
            .post("/api/auth/reset-password")
            .send({ token: resetToken, newPassword: "newpassword456" });

        expect(resetRes.status).toBe(200);
        expect(resetRes.body.message).toMatch(/reset successfully/i);
    });

    it("login with new password works after reset", async () => {
        await registerUser({ email: "newlogin@example.com" });

        // Request reset
        const forgotRes = await request(app)
            .post("/api/auth/forgot-password")
            .send({ email: "newlogin@example.com" });

        // Reset
        await request(app)
            .post("/api/auth/reset-password")
            .send({
                token: forgotRes.body.resetToken,
                newPassword: "brandnew789",
            });

        // Login with new password
        const loginRes = await request(app).post("/api/auth/login").send({
            email: "newlogin@example.com",
            password: "brandnew789",
        });

        expect(loginRes.status).toBe(200);
        expect(loginRes.body).toHaveProperty("token");

        // Old password should no longer work
        const oldLoginRes = await request(app).post("/api/auth/login").send({
            email: "newlogin@example.com",
            password: "oldpassword123",
        });

        expect(oldLoginRes.status).toBe(401);
    });

    it("POST /api/auth/reset-password with invalid token returns 400", async () => {
        const res = await request(app)
            .post("/api/auth/reset-password")
            .send({ token: "totally-fake-token", newPassword: "newpassword456" });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/invalid or expired/i);
    });

    it("POST /api/auth/reset-password with expired token returns 400", async () => {
        await registerUser({ email: "expired@example.com" });

        // Request reset
        const forgotRes = await request(app)
            .post("/api/auth/forgot-password")
            .send({ email: "expired@example.com" });

        const { resetToken } = forgotRes.body;

        // Manually expire the token in the database
        await User.updateOne(
            { email: "expired@example.com" },
            { passwordResetExpires: new Date(Date.now() - 1000) }
        );

        // Try to reset with expired token
        const resetRes = await request(app)
            .post("/api/auth/reset-password")
            .send({ token: resetToken, newPassword: "newpassword456" });

        expect(resetRes.status).toBe(400);
        expect(resetRes.body.message).toMatch(/invalid or expired/i);
    });

    it("reset token is single-use (cannot be reused)", async () => {
        await registerUser({ email: "singleuse@example.com" });

        const forgotRes = await request(app)
            .post("/api/auth/forgot-password")
            .send({ email: "singleuse@example.com" });

        const { resetToken } = forgotRes.body;

        // First reset — should succeed
        const first = await request(app)
            .post("/api/auth/reset-password")
            .send({ token: resetToken, newPassword: "first-new-pass" });
        expect(first.status).toBe(200);

        // Second reset with same token — should fail
        const second = await request(app)
            .post("/api/auth/reset-password")
            .send({ token: resetToken, newPassword: "second-new-pass" });
        expect(second.status).toBe(400);
    });

    it("POST /api/auth/reset-password with missing fields returns 400", async () => {
        const res = await request(app)
            .post("/api/auth/reset-password")
            .send({});

        expect(res.status).toBe(400);
    });

    // -----------------------------------------------------------------------
    // Reset invalidates all refresh tokens
    // -----------------------------------------------------------------------

    it("password reset invalidates all existing refresh tokens", async () => {
        const { refreshToken } = await registerUser({ email: "invalidate@example.com" });

        // Request and complete password reset
        const forgotRes = await request(app)
            .post("/api/auth/forgot-password")
            .send({ email: "invalidate@example.com" });

        await request(app)
            .post("/api/auth/reset-password")
            .send({
                token: forgotRes.body.resetToken,
                newPassword: "resetpass123",
            });

        // Old refresh token should be invalid
        const refreshRes = await request(app)
            .post("/api/auth/refresh")
            .send({ refreshToken });

        expect(refreshRes.status).toBe(401);
    });
});
