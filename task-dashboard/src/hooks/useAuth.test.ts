import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useAuth } from "./useAuth";
import { REFRESH_TOKEN_KEY } from "../lib/api";
import { TOKEN_KEY, USER_KEY } from "../types";

const storeSession = (user: unknown, token = "stored-token") => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, typeof user === "string" ? user : JSON.stringify(user));
  localStorage.setItem(REFRESH_TOKEN_KEY, "stored-refresh");
};

const validUser = { id: "u1", name: "Tuan", email: "tuan@example.com", role: "user" };

afterEach(() => {
  localStorage.clear();
});

describe("useAuth session restore", () => {
  it("restores a well-formed stored session", () => {
    storeSession(validUser);

    const { result } = renderHook(() => useAuth());

    expect(result.current.token).toBe("stored-token");
    expect(result.current.user).toEqual(validUser);
  });

  it("never grants admin from an unrecognised stored role", () => {
    // localStorage is user-writable, so a tampered role must not survive parsing.
    // Server-side RBAC is the real gate, but the client must not render the
    // console or issue its requests on the strength of a forged value.
    storeSession({ ...validUser, role: "superadmin" });

    const { result } = renderHook(() => useAuth());

    expect(result.current.user?.role).toBe("user");
  });

  it("keeps a genuine admin role", () => {
    storeSession({ ...validUser, role: "admin" });

    const { result } = renderHook(() => useAuth());

    expect(result.current.user?.role).toBe("admin");
  });

  it("defaults a session persisted before roles existed to user", () => {
    storeSession({ id: validUser.id, name: validUser.name, email: validUser.email });

    const { result } = renderHook(() => useAuth());

    expect(result.current.user?.role).toBe("user");
  });

  it("discards a malformed stored user", () => {
    storeSession("{not json");

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });

  it("discards a stored user missing required fields", () => {
    storeSession({ id: "u1", name: "Tuan" });

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });
});

describe("useAuth token handling", () => {
  it("persists a refreshed token pair without disturbing the stored user", () => {
    storeSession(validUser);

    const { result } = renderHook(() => useAuth());

    act(() => result.current.onTokensRefreshed("fresh-access", "fresh-refresh"));

    expect(result.current.token).toBe("fresh-access");
    expect(localStorage.getItem(TOKEN_KEY)).toBe("fresh-access");
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBe("fresh-refresh");
    expect(result.current.user).toEqual(validUser);
  });

  it("reads the current tokens from storage rather than a stale closure", () => {
    storeSession(validUser);

    const { result } = renderHook(() => useAuth());

    act(() => result.current.onTokensRefreshed("fresh-access", "fresh-refresh"));

    expect(result.current.getAccessToken()).toBe("fresh-access");
    expect(result.current.getRefreshToken()).toBe("fresh-refresh");
  });

  it("revokes the refresh token server side and clears local state on logout", async () => {
    storeSession(validUser);
    const fetchMock = vi.fn<typeof fetch>(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAuth());

    await act(() => result.current.handleLogout());

    const [url, options] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/api/auth/logout");
    expect(JSON.parse(String(options?.body))).toEqual({
      refreshToken: "stored-refresh",
    });

    expect(result.current.token).toBe("");
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
  });

  it("still clears local state when the server logout call fails", async () => {
    // Otherwise a network blip would leave the user apparently signed in.
    storeSession(validUser);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      })
    );

    const { result } = renderHook(() => useAuth());

    await act(() => result.current.handleLogout());

    expect(result.current.token).toBe("");
    expect(localStorage.getItem(REFRESH_TOKEN_KEY)).toBeNull();
  });
});
