import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useAnalytics } from "./useAnalytics";
import type { AuthCallbacks } from "../lib/api";

const ANALYTICS = {
  statusStats: [{ _id: "pending", count: 2 }],
  priorityStats: [{ _id: "high", count: 1 }],
  creationTrend: [{ _id: "2026-07-01", count: 2 }],
  tagStats: [{ _id: "api", count: 1 }],
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const makeCallbacks = (overrides: Partial<AuthCallbacks> = {}): AuthCallbacks => ({
  getAccessToken: () => "valid-token",
  getRefreshToken: () => "refresh-token",
  onTokensRefreshed: vi.fn(),
  onRefreshFailed: vi.fn(),
  ...overrides,
});

describe("useAnalytics", () => {
  it("loads analytics for a signed-in user", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json(ANALYTICS)));

    const { result } = renderHook(() => useAnalytics("valid-token", makeCallbacks()));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.analytics).toEqual(ANALYTICS);
    expect(result.current.error).toBe("");
  });

  it("refreshes an expired access token and retries", async () => {
    let refreshed = false;
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/api/auth/refresh")) {
        refreshed = true;
        return json({ token: "fresh-token", refreshToken: "fresh-refresh" });
      }
      return refreshed ? json(ANALYTICS) : json({ message: "jwt expired" }, 401);
    });
    vi.stubGlobal("fetch", fetchMock);

    const callbacks = makeCallbacks();
    const { result } = renderHook(() => useAnalytics("expired-token", callbacks));

    await waitFor(() => expect(result.current.analytics).toEqual(ANALYTICS));
    expect(result.current.error).toBe("");
    expect(callbacks.onTokensRefreshed).toHaveBeenCalledWith("fresh-token", "fresh-refresh");
  });

  it("surfaces a server error instead of silently showing empty charts", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ message: "boom" }, 500)));

    const { result } = renderHook(() => useAnalytics("valid-token", makeCallbacks()));

    await waitFor(() => expect(result.current.error).toContain("500"));
  });

  it("refetches when refreshAnalytics is called", async () => {
    const fetchMock = vi.fn(async () => json(ANALYTICS));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAnalytics("valid-token", makeCallbacks()));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    act(() => result.current.refreshAnalytics());

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });

  it("shows nothing once the user is signed out", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json(ANALYTICS)));

    const { result, rerender } = renderHook(
      (props: { token: string }) => useAnalytics(props.token, makeCallbacks()),
      { initialProps: { token: "valid-token" } }
    );

    await waitFor(() => expect(result.current.analytics).toEqual(ANALYTICS));

    rerender({ token: "" });

    expect(result.current.analytics).toEqual({
      statusStats: [],
      priorityStats: [],
      creationTrend: [],
      tagStats: [],
    });
  });
});
