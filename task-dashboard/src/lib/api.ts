// ─── API configuration ────────────────────────────────────────────────────────

const DEFAULT_API_BASE_URL = "https://task-management-api-71ba.onrender.com";

const normalizeApiBaseUrl = (value?: string): string => {
  if (!value?.trim()) {
    return DEFAULT_API_BASE_URL;
  }

  try {
    return new URL(value.trim()).origin;
  } catch {
    return value.trim().replace(/\/$/, "");
  }
};

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

export const apiPath = (path: string) => `${API_BASE_URL}${path}`;

export const createHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});
