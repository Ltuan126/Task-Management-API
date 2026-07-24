# Spec: Technical Debt Cleanup & Platform Stability

## Objective
Establish a highly stable, production-ready foundation for the Task Management API (Backend) and Task Dashboard (Frontend). This spec covers the resolution of all Priority 2 issues identified during the comprehensive assessment, enhancing error handling, connection resiliency, TypeScript type safety, bundle size, and accessibility.

## Tech Stack
- **Backend**: Node.js, Express v5.x, Mongoose, Swagger UI Express, Jest, Supertest
- **Frontend**: React 19, TypeScript v6.x, Vite, Chart.js

## Commands
- **Backend Dev**: `npm run dev` (in `backend-clean-api`)
- **Backend Test**: `npm test` (in `backend-clean-api`)
- **Frontend Dev**: `npm run dev` (in `task-dashboard`)
- **Frontend Build**: `npm run build` (in `task-dashboard`)

## Project Structure
- `backend-clean-api/src/` -> Backend source code
- `backend-clean-api/tests/` -> Backend tests
- `task-dashboard/src/` -> Frontend source code
- `docs/specs/` -> Specification documents

## Code Style
- Use asynchronous error handling properly in controllers (e.g. wrapping or passing to `next(err)`).
- Ensure TypeScript files adhere to strict null checks.
- Do not repeat utility code (DRY principle).

## Testing Strategy
- Run all existing backend integration tests. Ensure they pass after each cleanup step.
- Ensure the frontend builds cleanly without TypeScript compiler (`tsc`) errors.

## Boundaries
- **Always**: Ensure backend tests pass before committing. Test step-by-step.
- **Ask first**: If a refactoring requires modifying existing database schemas beyond adding validation options.
- **Never**: Commit secrets, swallow exceptions silently without logging, or disable type checks with `any`/`// @ts-ignore` to pass strict mode.

## Success Criteria
- [x] **Backend Connections & Shutdown**:
  - The server only starts listening (`app.listen()`) after successfully connecting to MongoDB (`connectDB()` resolved). — [server.js](../../backend-clean-api/src/server.js)
  - Graceful shutdown handlers are registered for `SIGTERM` and `SIGINT` to close the database connection and the HTTP server safely.
- [x] **Backend Code Quality & Error Consistency**:
  - Auth controller error responses are standardized. Avoid leaking raw database errors.
  - Duplicated helpers like `getJwtSecret` and `sendValidationErrors` are moved to shared modules ([config/jwt.js](../../backend-clean-api/src/config/jwt.js), [middlewares/validation.middleware.js](../../backend-clean-api/src/middlewares/validation.middleware.js)).
- [x] **Backend Admin API**:
  - The `/api/admin/users` endpoint supports query-based pagination (`page`, `limit`) instead of returning all users.
  - Task fields `title`, `description`, and `tags` have validation constraints (e.g. `maxlength`) on the schema level.
  - Swagger UI documentation includes missing endpoints (`/api/tasks/stats`, `/api/tasks/analytics`, `/api/admin/*`, `/api/audit/*`).
- [x] **Frontend Stability**:
  - `strict: true` is enabled in `tsconfig.json` and all resulting compile errors are resolved.
  - An `ErrorBoundary` component is implemented in the frontend to prevent a single render failure from rendering a blank page.
  - Dead CSS file `App.css` is removed and imports are cleaned up.
  - Chart.js auto-imports are replaced with explicit imports of only necessary elements to reduce package footprint.
- [x] **Frontend A11y & UX**:
  - Duplicate Google Fonts loading (link tag + `@import`) is resolved — the `@import` in [index.css](../../task-dashboard/src/index.css) was removed; the app now loads Inter once via the preconnected `<link>` in [index.html](../../task-dashboard/index.html).
  - Focus indicators (`:focus-visible`) are styled clearly for keyboard navigation — added a global rule plus input/select/button variants in `index.css`.
  - Important status banner notifications support screen readers using `aria-live` — error/success banners in [AuthPage.tsx](../../task-dashboard/src/components/AuthPage.tsx) and [TaskList.tsx](../../task-dashboard/src/components/TaskList.tsx) now carry `role="alert"`/`role="status"` + `aria-live`.
  - Motion transitions respect user preference via `prefers-reduced-motion` media queries — added to `index.css`.

## Open Questions
- None. Requirements are clear. All success criteria above are implemented and verified (80/80 backend tests passing, frontend `tsc -b` clean).
