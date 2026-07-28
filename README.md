# Task Management Workspace

A full-stack task management workspace with:

- A secured REST API (`backend-clean-api`) using Node.js, Express, and MongoDB.
- A React dashboard (`task-dashboard`) for live product demos.
- Automated CI/CD checks and deploys with GitHub Actions.

## Current Status

### Backend (`backend-clean-api`)

- Clean layered architecture: Route -> Controller -> Service -> Repository -> Model
- Auth: register/login with JWT, refresh token rotation, logout, and password reset
- Role-based authorization (`user` / `admin`) via `role.middleware.js`
- Ownership isolation: users can only access their own tasks
- User profile module (`/api/users`)
- Admin API with query-based pagination (`/api/admin/users`) and role management
- Audit logging (`/api/audit`) for admin-visible activity history, covering auth
  events, task CRUD, and privileged role changes (`USER_ROLE_CHANGED` records the
  actor and the before/after roles)
- Task metadata supported: `dueDate`, `priority`, `tags` (with schema-level `maxlength` validation)
- Task list features:
  - Pagination (`page`, `limit`)
  - Search (`q`)
  - Filters (`status`, `priority`, `dueDateFrom`, `dueDateTo`)
  - Sorting (`sortBy`, `sortOrder`)
- Task stats & analytics endpoints (`/api/tasks/stats`, `/api/tasks/analytics`)
- Graceful startup (DB connects before the HTTP server listens) and graceful shutdown on `SIGINT`/`SIGTERM`
- Swagger docs covering all endpoint groups (tasks, auth, admin, audit, users)
- Integration tests: 82 tests across 9 suites (auth, refresh tokens, password reset, user profile, task CRUD/ownership, admin, audit, analytics)

### Frontend (`task-dashboard`)

- React + Vite + TypeScript demo dashboard, `strict: true` TypeScript with zero compiler errors
- Register/login/logout flow with refresh-token rotation. Every data hook
  (tasks, analytics, admin) issues its requests through `authFetch` via the
  shared `useAuthRequest` hook, so an expired access token is refreshed and the
  request retried transparently instead of bouncing the user to the login screen.
- Task list with filters, sorting, search, and pagination
- Create, inline-edit, update status, and delete tasks
- Admin console (admins only): user directory with pagination and inline role
  management, plus a filterable audit trail (by action and email). Server-side
  RBAC remains the real gate — a tampered client role renders an empty shell and
  the API returns 403.
- Analytics panel with tree-shaken Chart.js imports (explicit element registration only)
- `ErrorBoundary` component so a single render failure doesn't blank the whole page
- Accessibility: single font load (no duplicate Google Fonts import), visible `:focus-visible`
  indicators for keyboard navigation, `aria-live` status/error banners, and
  `prefers-reduced-motion` support
- Unit tests: 31 tests across 5 suites (Vitest + Testing Library, jsdom), covering the
  `authFetch` refresh-and-retry path, the data hooks, and the stored-session parsing in
  `useAuth` (including the rule that a tampered `role` in localStorage never yields admin)

### CI/CD

- GitHub Actions workflow at `.github/workflows/ci.yml`
- Runs backend tests and the frontend job (lint + `tsc -b` + `vite build` + Vitest) on
  push/PR to `main` and `develop`
- Auto-deploys to Render: `main` -> production, `develop` -> staging (via deploy hooks).
  Both deploy jobs require the backend *and* frontend jobs to pass.

## Repository Structure

```text
Task-Management-API/
├── .github/
│   └── workflows/
│       └── ci.yml
├── backend-clean-api/
│   ├── src/
│   │   ├── config/
│   │   ├── middlewares/
│   │   ├── models/
│   │   ├── modules/
│   │   │   ├── admin/
│   │   │   ├── audit/
│   │   │   ├── auth/
│   │   │   ├── tasks/
│   │   │   └── users/
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   └── package.json
├── task-dashboard/
│   ├── src/
│   ├── public/
│   └── package.json
├── docs/
│   └── specs/
└── README.md
```

## API Endpoints

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

### Users

```text
GET /api/users/me
PUT /api/users/me
PUT /api/users/me/password
```

### Tasks (JWT required)

```text
GET    /api/tasks
GET    /api/tasks/:id
POST   /api/tasks
PUT    /api/tasks/:id
DELETE /api/tasks/:id
GET    /api/tasks/stats
GET    /api/tasks/analytics
```

### Admin (JWT + `admin` role required)

```text
GET   /api/admin/users
PATCH /api/admin/users/:id/role
GET   /api/audit
```

### Common Task Query Parameters

```text
page, limit, q, status, priority, dueDateFrom, dueDateTo, sortBy, sortOrder
```

### Swagger

```text
http://localhost:5000/api-docs
http://localhost:5000/api-docs.json
```

## Local Development

### 1) Start backend

```bash
cd backend-clean-api
npm install
npm run dev
```

Backend runs at `http://localhost:5000`.

### 2) Start dashboard

```bash
cd task-dashboard
npm install
npm run dev
```

Dashboard runs at `http://localhost:5173`.

## Environment Variables (Backend)

Create `backend-clean-api/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/taskdb
JWT_SECRET=your_strong_secret
JWT_EXPIRES_IN=7d
```

`JWT_SECRET` is required (no fallback is used).

## Tests

Run backend tests:

```bash
cd backend-clean-api
npm test
```

Run frontend tests:

```bash
cd task-dashboard
npm test
```

Type-check and build the frontend:

```bash
cd task-dashboard
npm run build
```

## Demo Flow (Recommended)

1. Register user A and create tasks.
2. Use filters/search/sort in the dashboard.
3. Login as user B and confirm user A tasks are not visible.
4. Promote user B to `admin` (see below), sign in as them, and use the admin
   console: change a role and watch the `USER_ROLE_CHANGED` entry appear in the
   audit trail with the actor and the before/after roles.
5. Show Swagger or the CI run for technical validation.

The first admin has to be promoted directly in the database, since the endpoint
that grants roles is itself admin-only:

```bash
mongosh taskdb --eval 'db.users.updateOne({email:"you@example.com"},{$set:{role:"admin"}})'
```

## Next Improvements

- E2E tests for the frontend (e.g. Playwright) — the Vitest suite covers hooks and
  the fetch layer, but nothing yet drives the real UI end to end
- Component-level tests for the dashboard's rendering layer (`TaskList`, `AdminPanel`,
  `AnalyticsPanel`), which the current suite does not touch
- Rate-limit and lockout policy tuning for auth endpoints under brute-force load
- Real staging environment smoke test after each CD deploy

See [`docs/specs/technical-debt-cleanup.md`](docs/specs/technical-debt-cleanup.md) for the completed
platform-stability cleanup spec (connection handling, error consistency, admin pagination, frontend
strict-mode, and accessibility fixes).

MIT License
