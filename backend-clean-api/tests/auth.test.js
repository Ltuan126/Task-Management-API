const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

process.env.JWT_EXPIRES_IN = "1h";
process.env.NODE_ENV = "test";

const app = require("../src/app");

describe("Auth API", () => {
    let mongoServer;
    const originalJwtSecret = process.env.JWT_SECRET;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);
    });

    afterEach(async () => {
        await mongoose.connection.db.dropDatabase();
    });

    afterAll(async () => {
        process.env.JWT_SECRET = originalJwtSecret;
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    it("registers a user and returns token", async () => {
        const response = await request(app).post("/api/auth/register").send({
            name: "Test User",
            email: "test@example.com",
            password: "secret123",
        });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty("token");
        expect(response.body.user.email).toBe("test@example.com");
    });

    it("logs in an existing user and returns token", async () => {
        await request(app).post("/api/auth/register").send({
            name: "Test User",
            email: "login@example.com",
            password: "secret123",
        });

        const response = await request(app).post("/api/auth/login").send({
            email: "login@example.com",
            password: "secret123",
        });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("token");
        expect(response.body.user.email).toBe("login@example.com");
    });

    it("returns 409 when registering with a duplicate email", async () => {
        const payload = {
            name: "Dup User",
            email: "dup@example.com",
            password: "secret123",
        };

        await request(app).post("/api/auth/register").send(payload);
        const response = await request(app).post("/api/auth/register").send(payload);

        expect(response.status).toBe(409);
        expect(response.body.message).toMatch(/email already exists/i);
    });

    it("returns 401 when login with wrong password", async () => {
        await request(app).post("/api/auth/register").send({
            name: "Pass User",
            email: "pass@example.com",
            password: "correctpassword",
        });

        const response = await request(app).post("/api/auth/login").send({
            email: "pass@example.com",
            password: "wrongpassword",
        });

        expect(response.status).toBe(401);
        expect(response.body.message).toMatch(/invalid email or password/i);
    });

    it("returns 400 when registering with missing name", async () => {
        const response = await request(app).post("/api/auth/register").send({
            email: "noname@example.com",
            password: "secret123",
        });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Validation failed");
    });

    it("returns 400 when logging in with invalid email format", async () => {
        const response = await request(app).post("/api/auth/login").send({
            email: "not-an-email",
            password: "secret123",
        });

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Validation failed");
    });

    it("returns 500 when JWT_SECRET is missing during register", async () => {
        delete process.env.JWT_SECRET;

        const response = await request(app).post("/api/auth/register").send({
            name: "No Secret User",
            email: "nosecret@example.com",
            password: "secret123",
        });

        expect(response.status).toBe(500);
        expect(response.body.message).toBe("JWT_SECRET is not configured");

        process.env.JWT_SECRET = originalJwtSecret;
    });
});
