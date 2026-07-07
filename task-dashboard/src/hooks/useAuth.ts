import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import { apiPath, REFRESH_TOKEN_KEY } from "../lib/api";
import { TOKEN_KEY, USER_KEY } from "../types";
import type { User, AuthResponse } from "../types";

export function useAuth() {
  const [token, setToken] = useState<string>(() => localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored);
      if (
        parsed &&
        typeof parsed === "object" &&
        typeof parsed.id === "string" &&
        typeof parsed.name === "string" &&
        typeof parsed.email === "string"
      ) {
        return parsed as User;
      }
      localStorage.removeItem(USER_KEY);
      return null;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  });

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // -------------------------------------------------------------------------
  // Persist / clear all auth tokens
  // -------------------------------------------------------------------------
  const persistAuth = useCallback(
    (data: AuthResponse) => {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      setToken(data.token);
      setUser(data.user);
    },
    []
  );

  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setToken("");
    setUser(null);
  }, []);

  // -------------------------------------------------------------------------
  // Register / Login
  // -------------------------------------------------------------------------
  const handleAuthSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setAuthLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const endpoint = isRegisterMode
      ? apiPath("/api/auth/register")
      : apiPath("/api/auth/login");

    const payload = isRegisterMode
      ? { name: name.trim(), email: email.trim(), password }
      : { email: email.trim(), password };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as AuthResponse & { message?: string };

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed");
      }

      persistAuth(data);
      setSuccessMessage(isRegisterMode ? "Account created" : "Signed in successfully");
      setEmail("");
      setPassword("");
      setName("");
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setAuthLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Logout — invalidate refresh token on server, then clear local state
  // -------------------------------------------------------------------------
  const handleLogout = useCallback(async () => {
    const currentToken = localStorage.getItem(TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    // Best-effort server-side logout (don't block on failure)
    if (currentToken && refreshToken) {
      try {
        await fetch(apiPath("/api/auth/logout"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentToken}`,
          },
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // Ignore — we still clear local state
      }
    }

    clearAuth();
  }, [clearAuth]);

  // -------------------------------------------------------------------------
  // Token refresh helpers (used by authFetch in api.ts)
  // -------------------------------------------------------------------------
  const getAccessToken = useCallback(() => {
    return localStorage.getItem(TOKEN_KEY) || "";
  }, []);

  const getRefreshToken = useCallback(() => {
    return localStorage.getItem(REFRESH_TOKEN_KEY) || "";
  }, []);

  const onTokensRefreshed = useCallback(
    (accessToken: string, refreshToken: string) => {
      localStorage.setItem(TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      setToken(accessToken);
    },
    []
  );

  return {
    token,
    user,
    isRegisterMode,
    setIsRegisterMode,
    email,
    setEmail,
    password,
    setPassword,
    name,
    setName,
    authLoading,
    errorMessage,
    successMessage,
    handleAuthSubmit,
    handleLogout,
    // Token refresh helpers for authFetch
    getAccessToken,
    getRefreshToken,
    onTokensRefreshed,
  };
}
