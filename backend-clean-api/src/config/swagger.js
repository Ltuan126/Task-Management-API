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
        { name: "Admin", description: "Admin management endpoints (requires admin role)" },
        { name: "Audit", description: "Audit log endpoints (requires admin role)" },
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
                    dueDate: { type: "string", format: "date-time", example: "2026-04-30T10:00:00.000Z" },
                    priority: { type: "string", enum: ["low", "medium", "high"], example: "medium" },
                    tags: {
                        type: "array",
                        items: { type: "string" },
                        example: ["api", "demo"],
                    },
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
            TaskListResponse: {
                type: "object",
                properties: {
                    items: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Task" },
                    },
                    pagination: {
                        type: "object",
                        properties: {
                            total: { type: "integer", example: 12 },
                            page: { type: "integer", example: 1 },
                            limit: { type: "integer", example: 10 },
                            totalPages: { type: "integer", example: 2 },
                        },
                    },
                },
            },
            TaskCreateRequest: {
                type: "object",
                required: ["title"],
                properties: {
                    title: { type: "string", example: "Prepare API demo" },
                    description: { type: "string", example: "Show login and CRUD flow" },
                    dueDate: { type: "string", format: "date-time", example: "2026-04-30T10:00:00.000Z" },
                    priority: { type: "string", enum: ["low", "medium", "high"], example: "medium" },
                    tags: {
                        type: "array",
                        items: { type: "string" },
                        example: ["api", "demo"],
                    },
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
                    dueDate: { type: "string", format: "date-time", example: "2026-04-30T10:00:00.000Z" },
                    priority: { type: "string", enum: ["low", "medium", "high"], example: "high" },
                    tags: {
                        type: "array",
                        items: { type: "string" },
                        example: ["urgent", "frontend"],
                    },
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
            TaskStatsResponse: {
                type: "object",
                properties: {
                    total: { type: "integer", example: 10 },
                    pending: { type: "integer", example: 4 },
                    inProgress: { type: "integer", example: 3 },
                    completed: { type: "integer", example: 3 },
                },
            },
            AggregationItem: {
                type: "object",
                properties: {
                    _id: { type: "string", example: "pending" },
                    count: { type: "integer", example: 5 },
                },
            },
            TaskAnalyticsResponse: {
                type: "object",
                properties: {
                    statusStats: {
                        type: "array",
                        items: { $ref: "#/components/schemas/AggregationItem" },
                    },
                    priorityStats: {
                        type: "array",
                        items: { $ref: "#/components/schemas/AggregationItem" },
                    },
                    creationTrend: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                _id: { type: "string", example: "2026-06-25" },
                                count: { type: "integer", example: 3 },
                            },
                        },
                    },
                    tagStats: {
                        type: "array",
                        items: { $ref: "#/components/schemas/AggregationItem" },
                    },
                },
            },
            AdminUser: {
                type: "object",
                properties: {
                    _id: { type: "string", example: "67f4a4d9a8ab0dcf8a3e4f11" },
                    name: { type: "string", example: "Demo User" },
                    email: { type: "string", example: "demo@example.com" },
                    role: { type: "string", enum: ["user", "admin"], example: "user" },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            AdminUserListResponse: {
                type: "object",
                properties: {
                    items: {
                        type: "array",
                        items: { $ref: "#/components/schemas/AdminUser" },
                    },
                    pagination: {
                        type: "object",
                        properties: {
                            total: { type: "integer", example: 25 },
                            page: { type: "integer", example: 1 },
                            limit: { type: "integer", example: 10 },
                            totalPages: { type: "integer", example: 3 },
                        },
                    },
                },
            },
            UpdateRoleRequest: {
                type: "object",
                required: ["role"],
                properties: {
                    role: { type: "string", enum: ["user", "admin"], example: "admin" },
                },
            },
            UpdateRoleResponse: {
                type: "object",
                properties: {
                    message: { type: "string", example: "User role updated successfully" },
                    user: { $ref: "#/components/schemas/AdminUser" },
                },
            },
            AuditLog: {
                type: "object",
                properties: {
                    _id: { type: "string", example: "67f4b1c2a8ab0dcf8a3e5a01" },
                    userId: { type: "string", example: "67f4a4d9a8ab0dcf8a3e4f11" },
                    email: { type: "string", example: "demo@example.com" },
                    action: { type: "string", example: "USER_LOGGED_IN" },
                    details: { type: "object", example: { name: "Demo User" } },
                    ipAddress: { type: "string", example: "::1" },
                    createdAt: { type: "string", format: "date-time" },
                },
            },
            AuditLogListResponse: {
                type: "object",
                properties: {
                    items: {
                        type: "array",
                        items: { $ref: "#/components/schemas/AuditLog" },
                    },
                    pagination: {
                        type: "object",
                        properties: {
                            total: { type: "integer", example: 100 },
                            page: { type: "integer", example: 1 },
                            limit: { type: "integer", example: 50 },
                            totalPages: { type: "integer", example: 2 },
                        },
                    },
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
                parameters: [
                    {
                        in: "query",
                        name: "page",
                        required: false,
                        schema: { type: "integer", minimum: 1, example: 1 },
                        description: "Page number (default: 1)",
                    },
                    {
                        in: "query",
                        name: "limit",
                        required: false,
                        schema: { type: "integer", minimum: 1, maximum: 100, example: 10 },
                        description: "Page size (default: 10, max: 100)",
                    },
                    {
                        in: "query",
                        name: "status",
                        required: false,
                        schema: {
                            type: "string",
                            enum: ["pending", "in-progress", "completed"],
                        },
                        description: "Filter by status",
                    },
                    {
                        in: "query",
                        name: "priority",
                        required: false,
                        schema: {
                            type: "string",
                            enum: ["low", "medium", "high"],
                        },
                        description: "Filter by priority",
                    },
                    {
                        in: "query",
                        name: "dueDateFrom",
                        required: false,
                        schema: { type: "string", format: "date-time", example: "2026-04-01T00:00:00.000Z" },
                        description: "Filter tasks due on or after this date",
                    },
                    {
                        in: "query",
                        name: "dueDateTo",
                        required: false,
                        schema: { type: "string", format: "date-time", example: "2026-04-30T23:59:59.999Z" },
                        description: "Filter tasks due on or before this date",
                    },
                    {
                        in: "query",
                        name: "q",
                        required: false,
                        schema: { type: "string", example: "demo" },
                        description: "Search by title or description",
                    },
                    {
                        in: "query",
                        name: "sortBy",
                        required: false,
                        schema: {
                            type: "string",
                            enum: ["createdAt", "updatedAt", "title", "status", "dueDate"],
                            example: "dueDate",
                        },
                        description: "Sort field",
                    },
                    {
                        in: "query",
                        name: "sortOrder",
                        required: false,
                        schema: { type: "string", enum: ["asc", "desc"], example: "desc" },
                        description: "Sort direction",
                    },
                ],
                responses: {
                    200: {
                        description: "Task list",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/TaskListResponse" },
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
        "/api/tasks/stats": {
            get: {
                tags: ["Tasks"],
                summary: "Get task status counts for the current user",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: "Task statistics",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/TaskStatsResponse" },
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
        "/api/tasks/analytics": {
            get: {
                tags: ["Tasks"],
                summary: "Get advanced analytics (status, priority, trend, tags)",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: {
                        description: "Analytics data",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/TaskAnalyticsResponse" },
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
        "/api/admin/users": {
            get: {
                tags: ["Admin"],
                summary: "List all users (paginated, admin only)",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "query",
                        name: "page",
                        required: false,
                        schema: { type: "integer", minimum: 1, example: 1 },
                        description: "Page number (default: 1)",
                    },
                    {
                        in: "query",
                        name: "limit",
                        required: false,
                        schema: { type: "integer", minimum: 1, maximum: 100, example: 10 },
                        description: "Page size (default: 10, max: 100)",
                    },
                ],
                responses: {
                    200: {
                        description: "Paginated user list",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/AdminUserListResponse" },
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
                    403: {
                        description: "Forbidden — admin role required",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
        },
        "/api/admin/users/{id}/role": {
            patch: {
                tags: ["Admin"],
                summary: "Update a user's role (admin only)",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "path",
                        name: "id",
                        required: true,
                        schema: { type: "string" },
                        description: "User ID",
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/UpdateRoleRequest" },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Role updated",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/UpdateRoleResponse" },
                            },
                        },
                    },
                    400: {
                        description: "Invalid role or self-modification",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
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
                    403: {
                        description: "Forbidden — admin role required",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                    404: {
                        description: "User not found",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ErrorResponse" },
                            },
                        },
                    },
                },
            },
        },
        "/api/audit": {
            get: {
                tags: ["Audit"],
                summary: "Get audit logs (paginated, admin only)",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        in: "query",
                        name: "page",
                        required: false,
                        schema: { type: "integer", minimum: 1, example: 1 },
                        description: "Page number (default: 1)",
                    },
                    {
                        in: "query",
                        name: "limit",
                        required: false,
                        schema: { type: "integer", minimum: 1, maximum: 100, example: 50 },
                        description: "Page size (default: 50, max: 100)",
                    },
                    {
                        in: "query",
                        name: "action",
                        required: false,
                        schema: {
                            type: "string",
                            enum: ["USER_REGISTERED", "USER_LOGGED_IN", "USER_LOGIN_FAILED", "TASK_CREATED", "TASK_UPDATED", "TASK_DELETED"],
                        },
                        description: "Filter by action type",
                    },
                    {
                        in: "query",
                        name: "email",
                        required: false,
                        schema: { type: "string", example: "demo@example.com" },
                        description: "Filter by user email (case-insensitive partial match)",
                    },
                ],
                responses: {
                    200: {
                        description: "Paginated audit log list",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/AuditLogListResponse" },
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
                    403: {
                        description: "Forbidden — admin role required",
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