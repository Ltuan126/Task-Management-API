const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

process.env.JWT_SECRET = "test_jwt_secret";
process.env.JWT_EXPIRES_IN = "1h";

const app = require("../src/app");

describe("Task ownership", () => {
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

    it("blocks access to another user's task", async () => {
        const user1 = await request(app).post("/api/auth/register").send({
            name: "Owner",
            email: "owner@example.com",
            password: "secret123",
        });

        const user2 = await request(app).post("/api/auth/register").send({
            name: "Other",
            email: "other@example.com",
            password: "secret123",
        });

        const createTaskResponse = await request(app)
            .post("/api/tasks")
            .set("Authorization", `Bearer ${user1.body.token}`)
            .send({
                title: "Owner Task",
                description: "Only owner can access",
            });

        expect(createTaskResponse.status).toBe(201);

        const readByOtherUser = await request(app)
            .get(`/api/tasks/${createTaskResponse.body._id}`)
            .set("Authorization", `Bearer ${user2.body.token}`);

        expect(readByOtherUser.status).toBe(404);
    });

    it("requires token for task routes", async () => {
        const response = await request(app).get("/api/tasks");

        expect(response.status).toBe(401);
    });

    it("returns 500 when JWT_SECRET is missing while verifying token", async () => {
        const originalJwtSecret = process.env.JWT_SECRET;
        delete process.env.JWT_SECRET;

        const response = await request(app)
            .get("/api/tasks")
            .set("Authorization", "Bearer sample.token.value");

        expect(response.status).toBe(500);
        expect(response.body.message).toBe("Server misconfiguration");

        process.env.JWT_SECRET = originalJwtSecret;
    });

    it("supports pagination, filtering, and sorting for current user", async () => {
        const registerResponse = await request(app).post("/api/auth/register").send({
            name: "Query User",
            email: "query@example.com",
            password: "secret123",
        });

        const token = registerResponse.body.token;

        await request(app)
            .post("/api/tasks")
            .set("Authorization", `Bearer ${token}`)
            .send({ title: "Bravo", description: "alpha contains" });

        await request(app)
            .post("/api/tasks")
            .set("Authorization", `Bearer ${token}`)
            .send({ title: "Alpha", description: "alpha keyword" });

        await request(app)
            .post("/api/tasks")
            .set("Authorization", `Bearer ${token}`)
            .send({ title: "Charlie", status: "completed" });

        const response = await request(app)
            .get("/api/tasks")
            .set("Authorization", `Bearer ${token}`)
            .query({
                q: "alpha",
                sortBy: "title",
                sortOrder: "asc",
                page: 1,
                limit: 1,
            });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.items)).toBe(true);
        expect(response.body.items).toHaveLength(1);
        expect(response.body.items[0].title).toBe("Alpha");
        expect(response.body.pagination.total).toBe(2);
        expect(response.body.pagination.page).toBe(1);
        expect(response.body.pagination.limit).toBe(1);
        expect(response.body.pagination.totalPages).toBe(2);
    });

    it("stores and returns dueDate, priority, and tags on tasks", async () => {
        const registerResponse = await request(app).post("/api/auth/register").send({
            name: "Metadata User",
            email: "metadata@example.com",
            password: "secret123",
        });

        const token = registerResponse.body.token;
        const dueDate = "2026-04-30T10:00:00.000Z";

        const createResponse = await request(app)
            .post("/api/tasks")
            .set("Authorization", `Bearer ${token}`)
            .send({
                title: "Task with metadata",
                description: "Check extra fields",
                dueDate,
                priority: "high",
                tags: ["stage3", "metadata"],
            });

        expect(createResponse.status).toBe(201);
        expect(createResponse.body.priority).toBe("high");
        expect(createResponse.body.tags).toEqual(["stage3", "metadata"]);
        expect(new Date(createResponse.body.dueDate).toISOString()).toBe(dueDate);

        const listResponse = await request(app)
            .get("/api/tasks")
            .set("Authorization", `Bearer ${token}`);

        expect(listResponse.status).toBe(200);
        expect(listResponse.body.items).toHaveLength(1);
        expect(listResponse.body.items[0].priority).toBe("high");
        expect(listResponse.body.items[0].tags).toEqual(["stage3", "metadata"]);
    });
});
