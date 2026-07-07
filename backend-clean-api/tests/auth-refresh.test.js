const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

process.env.JWT_EXPIRES_IN = "1h";
process.env.NODE_ENV = "test";

const app = require("../src/app");
const RefreshToken = require("../src/models/refresh-token.model");

describe("Auth Refresh Token API", () => {
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

    // Helper: register a user and return { token, refreshToken, user }
    const registerUser = async (overrides = {}) => {
        const payload = {
            name: "Test User",
            email: "test@example.com",
            password: "secret123",
            ...overrides,
        };
        const res = await request(app).post("/api/auth/register").send(payload);
        expect(res.status).toBe(201);
        return res.body;
    };

    // -----------------------------------------------------------------------
    // Registration & Login include refreshToken
    // -----------------------------------------------------------------------

    it("register returns both token and refreshToken", async () => {
        const body = await registerUser();

        expect(body).toHaveProperty("token");
        expect(body).toHaveProperty("refreshToken");
        expect(typeof body.refreshToken).toBe("string");
        expect(body.refreshToken.length).toBeGreaterThan(0);
    });

    it("login returns both token and refreshToken", async () => {
        await registerUser({ email: "login@example.com" });

        const res = await request(app).post("/api/auth/login").send({
            email: "login@example.com",
            password: "secret123",
        });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("token");
        expect(res.body).toHaveProperty("refreshToken");
    });

    // -----------------------------------------------------------------------
    // Refresh
    // -----------------------------------------------------------------------

    it("POST /api/auth/refresh with valid refresh token returns new pair", async () => {
        const { refreshToken } = await registerUser();

        const res = await request(app)
            .post("/api/auth/refresh")
            .send({ refreshToken });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("token");
        expect(res.body).toHaveProperty("refreshToken");
        // New refresh token should differ from the old one (rotation)
        expect(res.body.refreshToken).not.toBe(refreshToken);
    });

    it("old refresh token is invalid after rotation", async () => {
        const { refreshToken: oldToken } = await registerUser();

        // Use the old token once — should succeed
        const first = await request(app)
            .post("/api/auth/refresh")
            .send({ refreshToken: oldToken });
        expect(first.status).toBe(200);

        // Try the old token again — should fail (it was rotated)
        const second = await request(app)
            .post("/api/auth/refresh")
            .send({ refreshToken: oldToken });
        expect(second.status).toBe(401);
    });

    it("POST /api/auth/refresh with invalid token returns 401", async () => {
        const res = await request(app)
            .post("/api/auth/refresh")
            .send({ refreshToken: "totally-invalid-token" });

        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/invalid refresh token/i);
    });

    it("POST /api/auth/refresh with missing token returns 400", async () => {
        const res = await request(app)
            .post("/api/auth/refresh")
            .send({});

        expect(res.status).toBe(400);
    });

    // -----------------------------------------------------------------------
    // Logout
    // -----------------------------------------------------------------------

    it("POST /api/auth/logout invalidates refresh token", async () => {
        const { token, refreshToken } = await registerUser();

        // Logout
        const logoutRes = await request(app)
            .post("/api/auth/logout")
            .set("Authorization", `Bearer ${token}`)
            .send({ refreshToken });

        expect(logoutRes.status).toBe(200);
        expect(logoutRes.body.message).toMatch(/logged out/i);

        // Try to use the invalidated refresh token
        const refreshRes = await request(app)
            .post("/api/auth/refresh")
            .send({ refreshToken });

        expect(refreshRes.status).toBe(401);
    });

    it("POST /api/auth/logout requires auth", async () => {
        const res = await request(app)
            .post("/api/auth/logout")
            .send({ refreshToken: "some-token" });

        expect(res.status).toBe(401);
    });

    // -----------------------------------------------------------------------
    // Multi-device: multiple refresh tokens per user
    // -----------------------------------------------------------------------

    it("supports multiple active refresh tokens (multi-device)", async () => {
        // Register once, login twice to get two refresh tokens
        await registerUser({ email: "multi@example.com" });

        const login1 = await request(app).post("/api/auth/login").send({
            email: "multi@example.com",
            password: "secret123",
        });

        const login2 = await request(app).post("/api/auth/login").send({
            email: "multi@example.com",
            password: "secret123",
        });

        // Both should have different refresh tokens
        expect(login1.body.refreshToken).not.toBe(login2.body.refreshToken);

        // Both should work for refresh
        const refresh1 = await request(app)
            .post("/api/auth/refresh")
            .send({ refreshToken: login1.body.refreshToken });
        expect(refresh1.status).toBe(200);

        const refresh2 = await request(app)
            .post("/api/auth/refresh")
            .send({ refreshToken: login2.body.refreshToken });
        expect(refresh2.status).toBe(200);
    });
});
