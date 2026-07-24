import type { FormEvent } from "react";
import type { User } from "../types";

type Props = {
  isRegisterMode: boolean;
  setIsRegisterMode: (value: (current: boolean) => boolean) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  name: string;
  setName: (value: string) => void;
  authLoading: boolean;
  errorMessage: string;
  successMessage: string;
  onSubmit: (event: FormEvent) => void;
  // passed so that the dashboard can pre-set page after login
  onLoginSuccess?: (user: User) => void;
};

export function AuthPage({
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
  onSubmit,
}: Props) {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <h1>Task Command Center</h1>
        <p>Sign in to demo your secured task API with live filters and ownership isolation.</p>

        <form onSubmit={onSubmit} className="auth-form">
          {isRegisterMode && (
            <label>
              Full Name
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
          )}

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <button type="submit" disabled={authLoading}>
            {authLoading ? "Please wait..." : isRegisterMode ? "Create Account" : "Sign In"}
          </button>
        </form>

        <button
          className="secondary"
          onClick={() => setIsRegisterMode((current) => !current)}
          type="button"
        >
          {isRegisterMode ? "Already have an account? Sign in" : "Need an account? Register"}
        </button>

        {errorMessage && (
          <p className="banner error" role="alert" aria-live="assertive">
            {errorMessage}
          </p>
        )}
        {successMessage && (
          <p className="banner success" role="status" aria-live="polite">
            {successMessage}
          </p>
        )}
      </section>
    </main>
  );
}
