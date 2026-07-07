// ─── Domain types ─────────────────────────────────────────────────────────────

export type User = {
  id: string;
  name: string;
  email: string;
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

export type TaskListResponse = {
  items: Task[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
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
