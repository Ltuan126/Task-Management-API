const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test_jwt_secret";
process.env.JWT_EXPIRES_IN = "1h";
process.env.NODE_ENV = "test";

const app = require("../src/app");

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function registerAndLogin(overrides = {}) {
    const payload = {
        name: "Test User",
        email: `user_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`,
        password: "secret123",
        ...overrides,
    };
    const res = await request(app).post("/api/auth/register").send(payload);
    return { token: res.body.token, user: res.body.user };
}

async function createTask(token, overrides = {}) {
    const res = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Test Task", ...overrides });
    return res.body;
}

// ─── Setup ────────────────────────────────────────────────────────────────────

describe("Task CRUD", () => {
    let mongoServer;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        await mongoose.connect(mongoServer.getUri());
    });

    afterEach(async () => {
        await mongoose.connection.db.dropDatabase();
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    // ─── GET /api/tasks/:id ───────────────────────────────────────────────────

    describe("GET /api/tasks/:id", () => {
        it("returns the task when owner fetches by valid ID", async () => {
            const { token } = await registerAndLogin();
            const task = await createTask(token, { title: "Fetch Me", priority: "high" });

            const res = await request(app)
                .get(`/api/tasks/${task._id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body._id).toBe(task._id);
            expect(res.body.title).toBe("Fetch Me");
            expect(res.body.priority).toBe("high");
        });

        it("returns 404 when task does not exist", async () => {
            const { token } = await registerAndLogin();
            const nonExistentId = new mongoose.Types.ObjectId().toString();

            const res = await request(app)
                .get(`/api/tasks/${nonExistentId}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(404);
            expect(res.body.message).toMatch(/task not found/i);
        });

        it("returns 400 for a malformed task ID", async () => {
            const { token } = await registerAndLogin();

            const res = await request(app)
                .get("/api/tasks/not-a-valid-id")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/invalid task id/i);
        });
    });

    // ─── DELETE /api/tasks/:id ────────────────────────────────────────────────

    describe("DELETE /api/tasks/:id", () => {
        it("deletes own task and returns success message", async () => {
            const { token } = await registerAndLogin();
            const task = await createTask(token);

            const res = await request(app)
                .delete(`/api/tasks/${task._id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.message).toMatch(/task deleted/i);

            // Confirm it is gone
            const getRes = await request(app)
                .get(`/api/tasks/${task._id}`)
                .set("Authorization", `Bearer ${token}`);
            expect(getRes.status).toBe(404);
        });

        it("returns 404 when another user tries to delete the task", async () => {
            const owner = await registerAndLogin();
            const other = await registerAndLogin();
            const task = await createTask(owner.token);

            const res = await request(app)
                .delete(`/api/tasks/${task._id}`)
                .set("Authorization", `Bearer ${other.token}`);

            expect(res.status).toBe(404);
        });

        it("returns 404 when task does not exist", async () => {
            const { token } = await registerAndLogin();
            const nonExistentId = new mongoose.Types.ObjectId().toString();

            const res = await request(app)
                .delete(`/api/tasks/${nonExistentId}`)
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(404);
        });

        it("returns 400 for a malformed task ID", async () => {
            const { token } = await registerAndLogin();

            const res = await request(app)
                .delete("/api/tasks/bad-id")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/invalid task id/i);
        });
    });

    // ─── PUT /api/tasks/:id ───────────────────────────────────────────────────

    describe("PUT /api/tasks/:id", () => {
        it("returns 404 when another user tries to update the task", async () => {
            const owner = await registerAndLogin();
            const other = await registerAndLogin();
            const task = await createTask(owner.token);

            const res = await request(app)
                .put(`/api/tasks/${task._id}`)
                .set("Authorization", `Bearer ${other.token}`)
                .send({ title: "Hijacked" });

            expect(res.status).toBe(404);
        });

        it("returns 404 when task does not exist", async () => {
            const { token } = await registerAndLogin();
            const nonExistentId = new mongoose.Types.ObjectId().toString();

            const res = await request(app)
                .put(`/api/tasks/${nonExistentId}`)
                .set("Authorization", `Bearer ${token}`)
                .send({ title: "Ghost Update" });

            expect(res.status).toBe(404);
        });

        it("returns 400 for a malformed task ID", async () => {
            const { token } = await registerAndLogin();

            const res = await request(app)
                .put("/api/tasks/bad-id")
                .set("Authorization", `Bearer ${token}`)
                .send({ title: "Bad ID" });

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/invalid task id/i);
        });

        it("returns 400 when update payload has an invalid enum value", async () => {
            const { token } = await registerAndLogin();
            const task = await createTask(token);

            const res = await request(app)
                .put(`/api/tasks/${task._id}`)
                .set("Authorization", `Bearer ${token}`)
                .send({ status: "invalid-status" });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });

        it("returns 400 when update payload sets an empty title", async () => {
            const { token } = await registerAndLogin();
            const task = await createTask(token);

            const res = await request(app)
                .put(`/api/tasks/${task._id}`)
                .set("Authorization", `Bearer ${token}`)
                .send({ title: "   " }); // blank after trim

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });

        it("returns 400 when title exceeds 100 characters", async () => {
            const { token } = await registerAndLogin();
            const longTitle = "a".repeat(101);

            const res = await request(app)
                .post("/api/tasks")
                .set("Authorization", `Bearer ${token}`)
                .send({ title: longTitle });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });

        it("returns 400 when description exceeds 2000 characters", async () => {
            const { token } = await registerAndLogin();
            const longDesc = "a".repeat(2001);

            const res = await request(app)
                .post("/api/tasks")
                .set("Authorization", `Bearer ${token}`)
                .send({ title: "Valid Title", description: longDesc });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });

        it("returns 400 when any tag exceeds 30 characters", async () => {
            const { token } = await registerAndLogin();
            const longTag = "a".repeat(31);

            const res = await request(app)
                .post("/api/tasks")
                .set("Authorization", `Bearer ${token}`)
                .send({ title: "Valid Title", tags: ["normal", longTag] });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });

        it("returns 400 when tags array exceeds 30 items", async () => {
            const { token } = await registerAndLogin();
            const manyTags = Array(31).fill("tag");

            const res = await request(app)
                .post("/api/tasks")
                .set("Authorization", `Bearer ${token}`)
                .send({ title: "Valid Title", tags: manyTags });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe("Validation failed");
        });
    });

    // ─── Auth middleware ──────────────────────────────────────────────────────

    describe("Auth middleware — expired token", () => {
        it("returns 401 when JWT is expired", async () => {
            // Sign a token that expired 1 second ago
            const expiredToken = jwt.sign(
                { userId: new mongoose.Types.ObjectId().toString() },
                process.env.JWT_SECRET,
                { expiresIn: -1 }
            );

            const res = await request(app)
                .get("/api/tasks")
                .set("Authorization", `Bearer ${expiredToken}`);

            expect(res.status).toBe(401);
            expect(res.body.message).toMatch(/token expired/i);
        });

        it("returns 401 for a structurally invalid JWT", async () => {
            const res = await request(app)
                .get("/api/tasks")
                .set("Authorization", "Bearer this.is.not.valid");

            expect(res.status).toBe(401);
            expect(res.body.message).toMatch(/invalid token/i);
        });
    });

    // ─── GET /api/tasks/stats ─────────────────────────────────────────────────

    describe("GET /api/tasks/stats", () => {
        it("returns correct counts across all statuses", async () => {
            const { token } = await registerAndLogin();

            await createTask(token, { status: "pending" });
            await createTask(token, { status: "pending" });
            await createTask(token, { status: "in-progress" });
            await createTask(token, { status: "completed" });

            const res = await request(app)
                .get("/api/tasks/stats")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.pending).toBe(2);
            expect(res.body.inProgress).toBe(1);
            expect(res.body.completed).toBe(1);
            expect(res.body.total).toBe(4);
        });

        it("returns zero counts for a user with no tasks", async () => {
            const { token } = await registerAndLogin();

            const res = await request(app)
                .get("/api/tasks/stats")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.total).toBe(0);
            expect(res.body.pending).toBe(0);
        });

        it("only counts tasks belonging to the requesting user", async () => {
            const owner = await registerAndLogin();
            const other = await registerAndLogin();

            // owner has 3 tasks, other has 1
            await createTask(owner.token, { status: "pending" });
            await createTask(owner.token, { status: "completed" });
            await createTask(owner.token, { status: "in-progress" });
            await createTask(other.token, { status: "pending" });

            const res = await request(app)
                .get("/api/tasks/stats")
                .set("Authorization", `Bearer ${owner.token}`);

            expect(res.status).toBe(200);
            expect(res.body.total).toBe(3);
        });
    });
});

