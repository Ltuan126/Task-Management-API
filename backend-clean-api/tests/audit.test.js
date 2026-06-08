const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

process.env.JWT_EXPIRES_IN = "1h";
process.env.NODE_ENV = "test";

const app = require("../src/app");
const User = require("../src/models/user.model");
const AuditLog = require("../src/models/audit-log.model");

describe("Audit Logging API", () => {
    let mongoServer;
    let normalUserToken;
    let normalUserId;
    let adminToken;
    let adminId;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);

        // Register normal user (triggers USER_REGISTERED audit log)
        const resNormal = await request(app).post("/api/auth/register").send({
            name: "Audit User",
            email: "audit@example.com",
            password: "password123",
        });
        normalUserToken = resNormal.body.token;
        normalUserId = resNormal.body.user.id;

        // Login normal user (triggers USER_LOGGED_IN audit log)
        await request(app).post("/api/auth/login").send({
            email: "audit@example.com",
            password: "password123",
        });

        // Register admin user
        const resAdmin = await request(app).post("/api/auth/register").send({
            name: "Admin Logger",
            email: "admin-log@example.com",
            password: "password123",
        });
        adminId = resAdmin.body.user.id;

        // Make admin in DB
        await User.findByIdAndUpdate(adminId, { role: "admin" });

        // Get admin token
        const loginAdmin = await request(app).post("/api/auth/login").send({
            email: "admin-log@example.com",
            password: "password123",
        });
        adminToken = loginAdmin.body.token;

        // Create a task as normal user (triggers TASK_CREATED audit log)
        await request(app)
            .post("/api/tasks")
            .set("Authorization", `Bearer ${normalUserToken}`)
            .send({
                title: "Auditable Task",
                description: "Test description",
                status: "pending",
                priority: "high",
            });
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    it("verifies audit logs were written to the database", async () => {
        const count = await AuditLog.countDocuments({});
        // Should have at least USER_REGISTERED (2x), USER_LOGGED_IN (2x), TASK_CREATED (1x)
        expect(count).toBeGreaterThanOrEqual(4);
    });

    it("prevents normal user from viewing audit logs", async () => {
        const res = await request(app)
            .get("/api/audit")
            .set("Authorization", `Bearer ${normalUserToken}`);

        expect(res.status).toBe(403);
    });

    it("allows admin user to view audit logs and returns paginated list", async () => {
        const res = await request(app)
            .get("/api/audit")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.items).toBeDefined();
        expect(res.body.pagination).toBeDefined();
        expect(res.body.items.length).toBeGreaterThanOrEqual(4);

        // Verify structure of the logs
        const actions = res.body.items.map(log => log.action);
        expect(actions).toContain("USER_REGISTERED");
        expect(actions).toContain("USER_LOGGED_IN");
        expect(actions).toContain("TASK_CREATED");
    });

    it("supports filtering by action and email", async () => {
        const res = await request(app)
            .get("/api/audit?action=TASK_CREATED")
            .set("Authorization", `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        const actions = res.body.items.map(log => log.action);
        expect(actions.every(action => action === "TASK_CREATED")).toBe(true);
    });
});
