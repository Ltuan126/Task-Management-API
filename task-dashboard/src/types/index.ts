// ─── Domain types ─────────────────────────────────────────────────────────────

export type Role = "user" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type AuthResponse = {
  user: User;
  token: string;
  refreshToken: string;
};

export type Task = {
  _id: string;
  title: string;
  description?: string;
  status: "pending" | "in-progress" | "completed";
  priority: "low" | "medium" | "high";
  tags: string[];
  dueDate?: string;
  createdAt: string;
};

export type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

/** Every paginated list endpoint returns this envelope. */
export type Paginated<T> = {
  items: T[];
  pagination: Pagination;
};

export type TaskListResponse = Paginated<Task>;

// ─── Admin types ───────────────────────────────────────────────────────────────

/** A user row as returned by GET /api/admin/users (password is never included). */
export type AdminUser = {
  _id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
};

/** An entry from GET /api/audit. `details` shape varies per action. */
export type AuditLogEntry = {
  _id: string;
  userId?: string;
  email?: string;
  action: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
};

// ─── Constants & helpers ───────────────────────────────────────────────────────

export const TOKEN_KEY = "task_dashboard_token";
export const USER_KEY = "task_dashboard_user";

export const statusOptions: Array<{ value: Task["status"]; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

export const formatStatusLabel = (status: Task["status"]) =>
  statusOptions.find((option) => option.value === status)?.label ?? status;

export const roleOptions: Array<{ value: Role; label: string }> = [
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
];

/**
 * Audit actions emitted by the backend. Keep in sync with the `action:` values
 * in backend-clean-api/src/modules/**\/*.controller.js — used to populate the
 * audit filter dropdown.
 */
export const auditActions = [
  "USER_REGISTERED",
  "USER_LOGGED_IN",
  "USER_LOGIN_FAILED",
  "USER_LOGGED_OUT",
  "USER_ROLE_CHANGED",
  "PASSWORD_RESET_REQUESTED",
  "PASSWORD_RESET_COMPLETED",
  "TASK_CREATED",
  "TASK_UPDATED",
  "TASK_DELETED",
] as const;

/** "USER_LOGGED_IN" → "User logged in" */
export const formatAuditAction = (action: string) => {
  const words = action.toLowerCase().split("_");
  return words.map((word, index) => (index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word)).join(" ");
};

/**
 * Group actions into tones so the audit table can colour-code at a glance.
 * Failures and privilege changes are the two that matter most to spot.
 */
export const auditActionTone = (action: string): "danger" | "warn" | "ok" | "neutral" => {
  if (action.endsWith("_FAILED")) return "danger";
  if (action === "USER_ROLE_CHANGED") return "warn";
  if (action.startsWith("PASSWORD_RESET")) return "warn";
  if (action === "TASK_DELETED") return "danger";
  if (action === "USER_REGISTERED" || action === "TASK_CREATED") return "ok";
  return "neutral";
};
