// 🔧 API configuration 🔧

const DEFAULT_API_BASE_URL = "https://task-management-api-71ba.onrender.com";

const normalizeApiBaseUrl = (value?: string): string => {
  if (!value?.trim()) {
    // `.env.development` intentionally leaves this empty so requests stay
    // relative and go through the Vite dev proxy (see vite.config.ts), which
    // forwards /api to the local backend. Falling back to the production URL
    // here would silently point `npm run dev` at live data.
    return import.meta.env.DEV ? "" : DEFAULT_API_BASE_URL;
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

// ---------------------------------------------------------------------------
// Token storage keys
// ---------------------------------------------------------------------------
export const REFRESH_TOKEN_KEY = "task_dashboard_refresh_token";

// ---------------------------------------------------------------------------
// Authenticated fetch with automatic token refresh on 401
// ---------------------------------------------------------------------------

/**
 * A fetch wrapper that automatically attempts to refresh the access token
 * when a 401 response is received. If the refresh succeeds, the original
 * request is retried with the new access token.
 *
 * @param url        The URL to fetch
 * @param options    Standard fetch options (must include Authorization header)
 * @param callbacks  Functions to get/set tokens and handle logout
 */
export async function authFetch(
  url: string,
  options: RequestInit,
  callbacks: {
    getAccessToken: () => string;
    getRefreshToken: () => string;
    onTokensRefreshed: (accessToken: string, refreshToken: string) => void;
    onRefreshFailed: () => void;
  }
): Promise<Response> {
  // First attempt
  let response = await fetch(url, options);

  if (response.status !== 401) {
    return response;
  }

  // 401 — try to refresh
  const refreshToken = callbacks.getRefreshToken();
  if (!refreshToken) {
    callbacks.onRefreshFailed();
    return response;
  }

  try {
    const refreshResponse = await fetch(apiPath("/api/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!refreshResponse.ok) {
      callbacks.onRefreshFailed();
      return response;
    }

    const data = await refreshResponse.json();
    callbacks.onTokensRefreshed(data.token, data.refreshToken);

    // Retry original request with new access token
    const retryHeaders = new Headers(options.headers);
    retryHeaders.set("Authorization", `Bearer ${data.token}`);

    response = await fetch(url, {
      ...options,
      headers: retryHeaders,
    });

    return response;
  } catch {
    callbacks.onRefreshFailed();
    return response;
  }
}
