const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

process.env.JWT_EXPIRES_IN = "1h";
process.env.NODE_ENV = "test";

const app = require("../src/app");

describe("Users Profile API", () => {
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

    // Helper: register and return { token, user }
    const registerUser = async (overrides = {}) => {
        const payload = {
            name: "Profile User",
            email: "profile@example.com",
            password: "secret123",
            ...overrides,
        };
        const res = await request(app).post("/api/auth/register").send(payload);
        expect(res.status).toBe(201);
        return res.body;
    };

    // -----------------------------------------------------------------------
    // GET /api/users/me
    // -----------------------------------------------------------------------

    it("GET /api/users/me returns current user profile", async () => {
        const { token } = await registerUser();

        const res = await request(app)
            .get("/api/users/me")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("name", "Profile User");
        expect(res.body).toHaveProperty("email", "profile@example.com");
        expect(res.body).not.toHaveProperty("password");
    });

    it("GET /api/users/me without auth returns 401", async () => {
        const res = await request(app).get("/api/users/me");
        expect(res.status).toBe(401);
    });

    // -----------------------------------------------------------------------
    // PUT /api/users/me — update profile
    // -----------------------------------------------------------------------

    it("PUT /api/users/me updates name", async () => {
        const { token } = await registerUser();

        const res = await request(app)
            .put("/api/users/me")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Updated Name" });

        expect(res.status).toBe(200);
        expect(res.body.name).toBe("Updated Name");
    });

    it("PUT /api/users/me updates email", async () => {
        const { token } = await registerUser();

        const res = await request(app)
            .put("/api/users/me")
            .set("Authorization", `Bearer ${token}`)
            .send({ email: "newemail@example.com" });

        expect(res.status).toBe(200);
        expect(res.body.email).toBe("newemail@example.com");
    });

    it("PUT /api/users/me rejects duplicate email", async () => {
        // Register two users
        await registerUser({ email: "user1@example.com" });
        const { token } = await registerUser({ email: "user2@example.com" });

        // Try to update user2's email to user1's email
        const res = await request(app)
            .put("/api/users/me")
            .set("Authorization", `Bearer ${token}`)
            .send({ email: "user1@example.com" });

        expect(res.status).toBe(409);
        expect(res.body.message).toMatch(/already in use/i);
    });

    it("PUT /api/users/me rejects empty name", async () => {
        const { token } = await registerUser();

        const res = await request(app)
            .put("/api/users/me")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "" });

        expect(res.status).toBe(400);
    });

    // -----------------------------------------------------------------------
    // PUT /api/users/me/password — change password
    // -----------------------------------------------------------------------

    it("PUT /api/users/me/password changes password with correct current", async () => {
        const { token } = await registerUser({ email: "pwd@example.com" });

        const res = await request(app)
            .put("/api/users/me/password")
            .set("Authorization", `Bearer ${token}`)
            .send({
                currentPassword: "secret123",
                newPassword: "newsecret456",
            });

        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/changed/i);

        // Login with new password should work
        const loginRes = await request(app).post("/api/auth/login").send({
            email: "pwd@example.com",
            password: "newsecret456",
        });
        expect(loginRes.status).toBe(200);
    });

    it("PUT /api/users/me/password rejects wrong current password", async () => {
        const { token } = await registerUser();

        const res = await request(app)
            .put("/api/users/me/password")
            .set("Authorization", `Bearer ${token}`)
            .send({
                currentPassword: "wrongpassword",
                newPassword: "newsecret456",
            });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/incorrect/i);
    });

    it("PUT /api/users/me/password rejects short new password", async () => {
        const { token } = await registerUser();

        const res = await request(app)
            .put("/api/users/me/password")
            .set("Authorization", `Bearer ${token}`)
            .send({
                currentPassword: "secret123",
                newPassword: "ab",
            });

        expect(res.status).toBe(400);
    });

    it("PUT /api/users/me/password requires auth", async () => {
        const res = await request(app)
            .put("/api/users/me/password")
            .send({
                currentPassword: "secret123",
                newPassword: "newsecret456",
            });

        expect(res.status).toBe(401);
    });
});
