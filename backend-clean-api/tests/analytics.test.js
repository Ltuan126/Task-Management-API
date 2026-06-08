const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

process.env.JWT_EXPIRES_IN = "1h";
process.env.NODE_ENV = "test";

const app = require("../src/app");
const Task = require("../src/models/task.model");

describe("Analytics API", () => {
    let mongoServer;
    let userToken;
    let userId;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);

        // Register user
        const resUser = await request(app).post("/api/auth/register").send({
            name: "Analytics User",
            email: "analytics@example.com",
            password: "password123",
        });
        userToken = resUser.body.token;
        userId = resUser.body.user.id;

        // Create tasks to yield rich analytics
        await Task.create([
            {
                title: "Task 1",
                description: "Desc",
                status: "pending",
                priority: "high",
                tags: ["frontend", "bug"],
                owner: userId,
            },
            {
                title: "Task 2",
                description: "Desc",
                status: "in-progress",
                priority: "medium",
                tags: ["backend"],
                owner: userId,
            },
            {
                title: "Task 3",
                description: "Desc",
                status: "completed",
                priority: "low",
                tags: ["frontend", "documentation"],
                owner: userId,
            },
        ]);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    it("returns rich analytics for user tasks", async () => {
        const res = await request(app)
            .get("/api/tasks/analytics")
            .set("Authorization", `Bearer ${userToken}`);

        expect(res.status).toBe(200);

        // Check Status stats
        expect(res.body.statusStats).toBeDefined();
        const statuses = res.body.statusStats.map(s => s._id);
        expect(statuses).toContain("pending");
        expect(statuses).toContain("in-progress");
        expect(statuses).toContain("completed");

        // Check Priority stats
        expect(res.body.priorityStats).toBeDefined();
        const priorities = res.body.priorityStats.map(p => p._id);
        expect(priorities).toContain("high");
        expect(priorities).toContain("medium");
        expect(priorities).toContain("low");

        // Check Tag stats
        expect(res.body.tagStats).toBeDefined();
        const tags = res.body.tagStats.find(t => t._id === "frontend");
        expect(tags.count).toBe(2);

        // Check Creation Trend
        expect(res.body.creationTrend).toBeDefined();
        expect(res.body.creationTrend.length).toBeGreaterThan(0);
    });
});
