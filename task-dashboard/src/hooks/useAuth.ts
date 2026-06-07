import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import { apiPath } from "../lib/api";
import { TOKEN_KEY, USER_KEY } from "../types";
import type { User, AuthResponse } from "../types";

export function useAuth() {
  const [token, setToken] = useState<string>(() => localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? (JSON.parse(stored) as User) : null;
  });

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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

      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
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

  const handleLogout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken("");
    setUser(null);
  }, []);

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
  };
}
