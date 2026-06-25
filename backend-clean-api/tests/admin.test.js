const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

process.env.JWT_EXPIRES_IN = "1h";
process.env.NODE_ENV = "test";

const app = require("../src/app");
const User = require("../src/models/user.model");
const Task = require("../src/models/task.model");

describe("Admin & RBAC API", () => {
    let mongoServer;
    let normalUserToken;
    let normalUserId;
    let adminToken;
    let adminId;
    let otherUserTask;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);

        // Register normal user
        const resNormal = await request(app).post("/api/auth/register").send({
            name: "Normal User",
            email: "normal@example.com",
            password: "password123",
        });
        normalUserToken = resNormal.body.token;
        normalUserId = resNormal.body.user.id;

        // Register admin user
        const resAdmin = await request(app).post("/api/auth/register").send({
            name: "Admin User",
            email: "admin@example.com",
            password: "password123",
        });
        adminToken = resAdmin.body.token;
        adminId = resAdmin.body.user.id;

        // Force role change to admin in database
        await User.findByIdAndUpdate(adminId, { role: "admin" });

        // Generate updated admin token by logging in again
        const loginAdmin = await request(app).post("/api/auth/login").send({
            email: "admin@example.com",
            password: "password123",
        });
        adminToken = loginAdmin.body.token;

        // Create a task owned by normal user
        otherUserTask = await Task.create({
            title: "Normal User Task",
            description: "Some description",
            status: "pending",
            priority: "medium",
            owner: normalUserId,
        });
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    describe("RBAC Route Access", () => {
        it("returns 403 when normal user tries to access admin route", async () => {
            const res = await request(app)
                .get("/api/admin/users")
                .set("Authorization", `Bearer ${normalUserToken}`);

            expect(res.status).toBe(403);
            expect(res.body.message).toMatch(/Forbidden/i);
        });

        it("allows admin user to access admin route and get all users (paginated)", async () => {
            const res = await request(app)
                .get("/api/admin/users")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("items");
            expect(res.body).toHaveProperty("pagination");
            expect(res.body.items.length).toBeGreaterThanOrEqual(2);
            expect(res.body.items[0]).not.toHaveProperty("password");
            expect(res.body.pagination.total).toBeGreaterThanOrEqual(2);
            expect(res.body.pagination.page).toBe(1);
            expect(res.body.pagination.limit).toBe(10);
        });

        it("supports custom page and limit query parameters", async () => {
            const res = await request(app)
                .get("/api/admin/users?page=2&limit=1")
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.items.length).toBe(1);
            expect(res.body.pagination.page).toBe(2);
            expect(res.body.pagination.limit).toBe(1);
        });

        it("allows admin to update user role", async () => {
            const res = await request(app)
                .patch(`/api/admin/users/${normalUserId}/role`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({ role: "admin" });

            expect(res.status).toBe(200);
            expect(res.body.user.role).toBe("admin");

            // Revert role
            await User.findByIdAndUpdate(normalUserId, { role: "user" });
        });

        it("prevents updating to invalid roles", async () => {
            const res = await request(app)
                .patch(`/api/admin/users/${normalUserId}/role`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({ role: "super-admin" });

            expect(res.status).toBe(400);
        });
    });

    describe("Admin Task Access Bypass", () => {
        it("allows admin to get a task owned by another user", async () => {
            const res = await request(app)
                .get(`/api/tasks/${otherUserTask._id}`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.title).toBe("Normal User Task");
        });

        it("allows admin to update a task owned by another user", async () => {
            const res = await request(app)
                .put(`/api/tasks/${otherUserTask._id}`)
                .set("Authorization", `Bearer ${adminToken}`)
                .send({ title: "Updated by Admin" });

            expect(res.status).toBe(200);
            expect(res.body.title).toBe("Updated by Admin");
        });

        it("allows admin to delete a task owned by another user", async () => {
            const res = await request(app)
                .delete(`/api/tasks/${otherUserTask._id}`)
                .set("Authorization", `Bearer ${adminToken}`);

            expect(res.status).toBe(200);

            // Verify it was deleted
            const check = await Task.findById(otherUserTask._id);
            expect(check).toBeNull();
        });
    });
});
