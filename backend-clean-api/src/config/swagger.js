const swaggerUi = require("swagger-ui-express");

const swaggerSpec = {
    openapi: "3.0.3",
    info: {
        title: "Task Management API",
        version: "1.0.0",
        description: "REST API for authentication and task management",
    },
    servers: [
        {
            url: "http://localhost:5000",
            description: "Local server",
        },
    ],
    tags: [
        { name: "Auth", description: "Authentication endpoints" },
        { name: "Tasks", description: "Task CRUD endpoints" },
        { name: "System", description: "System health endpoints" },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
            },
        },
        schemas: {
            User: {
                type: "object",
                properties: {
                    id: { type: "string", example: "67f4a4d9a8ab0dcf8a3e4f11" },
                    name: { type: "string", example: "Demo User" },
                    email: { type: "string", example: "demo@example.com" },
                },
            },
            AuthSuccess: {
                type: "object",
                properties: {
                    user: { $ref: "#/components/schemas/User" },
                    token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" },
                },
            },
            RegisterRequest: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                    name: { type: "string", example: "Demo User" },
                    email: { type: "string", format: "email", example: "demo@example.com" },
                    password: { type: "string", minLength: 6, example: "secret123" },
                },
            },
            LoginRequest: {
                type: "object",
                required: ["email", "password"],
                properties: {
                    email: { type: "string", format: "email", example: "demo@example.com" },
                    password: { type: "string", example: "secret123" },
                },
            },
            Task: {
                type: "object",
                properties: {
                    _id: { type: "string", example: "67f4a67ca8ab0dcf8a3e4f22" },
                    title: { type: "string", example: "Prepare API demo" },
                    description: { type: "string", example: "Show login and CRUD flow" },
                    status: {
                        type: "string",
                        enum: ["pending", "in-progress", "completed"],
                        example: "pending",
                    },
                    owner: { type: "string", example: "67f4a4d9a8ab0dcf8a3e4f11" },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            TaskCreateRequest: {
                type: "object",
                required: ["title"],
                properties: {
                    title: { type: "string", example: "Prepare API demo" },
                    description: { type: "string", example: "Show login and CRUD flow" },
                    status: {
                        type: "string",
                        enum: ["pending", "in-progress", "completed"],
                        example: "pending",
                    },
                },
            },
            TaskUpdateRequest: {
                type: "object",
                properties: {
                    title: { type: "string", example: "Updated title" },
                    description: { type: "string", example: "Updated description" },
                    status: {
                        type: "string",
                        enum: ["pending", "in-progress", "completed"],
                        example: "completed",
                    },
                },
            },
            ErrorResponse: {
                type: "object",
                properties: {
                    message: { type: "string", example: "Unauthorized" },
                },
            },
        },
    },
    paths: {
        "/": {
            get: {
                tags: ["System"],
                summary: "Root check",
                responses: {
                    200: {
                        description: "API is running",
                        content: {
                            "text/plain": {
                                schema: { type: "string", example: "Task Management API is working" },
                            },
                        },
                    },
                },
            },
        },
        "/health": {
            get: {
                tags: ["System"],
                summary: "Health check",
                responses: {
                    200: {
                        description: "Service health status",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        status: { type: "string", example: "OK" },
                                        message: { type: "string", example: "Server is healthy" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/auth/register": {
            post: {
                tags: ["Auth"],
                summary: "Register a new user",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/RegisterRequest" },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Registered successfully",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/AuthSuccess" },
                            },
                        },
                    },
                    400: {
                        description: "Validation failed",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                    409: {
                        description: "Email already exists",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
        },
        "/api/auth/login": {
            post: {
                tags: ["Auth"],
                summary: "Login with email and password",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/LoginRequest" },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Logged in successfully",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/AuthSuccess" },
                            },
                        },
                    },
                    400: {
                        description: "Validation failed",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                    401: {
                        description: "Invalid credentials",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
        },
        "/api/tasks": {
            get: {
                tags: ["Tasks"],
                summary: "Get all tasks of current user",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: "Task list",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "array",
                                    items: { $ref: "#/components/schemas/Task" },
                                },
                            },
                        },
                    },
                    401: {
                        description: "Unauthorized",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
            post: {
                tags: ["Tasks"],
                summary: "Create a new task",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/TaskCreateRequest" },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Task created",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Task" },
                            },
                        },
                    },
                    401: {
                        description: "Unauthorized",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
        },
        "/api/tasks/{id}": {
            get: {
                tags: ["Tasks"],
                summary: "Get one task by id",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    200: {
                        description: "Task detail",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Task" },
                            },
                        },
                    },
                    400: {
                        description: "Invalid task id",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                    404: {
                        description: "Task not found",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
            put: {
                tags: ["Tasks"],
                summary: "Update task by id",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/TaskUpdateRequest" },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Updated task",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/Task" },
                            },
                        },
                    },
                    400: {
                        description: "Invalid task id",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                    404: {
                        description: "Task not found",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
            delete: {
                tags: ["Tasks"],
                summary: "Delete task by id",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    200: {
                        description: "Delete result",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string", example: "Task deleted" },
                                    },
                                },
                            },
                        },
                    },
                    400: {
                        description: "Invalid task id",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                    404: {
                        description: "Task not found",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
        },
    },
};

const swaggerMiddleware = [swaggerUi.serve, swaggerUi.setup(swaggerSpec)];

module.exports = {
    swaggerSpec,
    swaggerMiddleware,
};