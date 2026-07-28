import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAuthRequest } from "./useAuthRequest";
import type { AuthCallbacks } from "../lib/api";

const makeCallbacks = (accessToken: string): AuthCallbacks => ({
  getAccessToken: () => accessToken,
  getRefreshToken: () => "refresh-token",
  onTokensRefreshed: vi.fn(),
  onRefreshFailed: vi.fn(),
});

describe("useAuthRequest", () => {
  it("keeps a stable request identity across renders", () => {
    // The fetch effects in useTasks/useAnalytics/useAdmin list `request` as a
    // dependency, so a new identity per render would refetch on every render.
    const { result, rerender } = renderHook(
      (props: { callbacks: AuthCallbacks }) => useAuthRequest(props.callbacks),
      { initialProps: { callbacks: makeCallbacks("token-1") } }
    );

    const first = result.current;
    // A caller passing a fresh object literal is the normal case — App.tsx does.
    rerender({ callbacks: makeCallbacks("token-2") });
    rerender({ callbacks: makeCallbacks("token-3") });

    expect(result.current).toBe(first);
  });

  it("reads the access token at call time, not when the hook rendered", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const { result, rerender } = renderHook(
      (props: { callbacks: AuthCallbacks }) => useAuthRequest(props.callbacks),
      { initialProps: { callbacks: makeCallbacks("stale-token") } }
    );

    // Simulates a refresh landing a new token between render and request.
    rerender({ callbacks: makeCallbacks("fresh-token") });
    await result.current("/api/tasks");

    const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
    expect(headers.get("Authorization")).toBe("Bearer fresh-token");
  });

  it("routes failures to the latest onRefreshFailed callback", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", { status: 401 }))
    );

    const stale = makeCallbacks("token-1");
    const latest = { ...makeCallbacks("token-2"), getRefreshToken: () => "" };

    const { result, rerender } = renderHook(
      (props: { callbacks: AuthCallbacks }) => useAuthRequest(props.callbacks),
      { initialProps: { callbacks: stale } }
    );

    rerender({ callbacks: latest });
    await result.current("/api/tasks");

    expect(latest.onRefreshFailed).toHaveBeenCalledTimes(1);
    expect(stale.onRefreshFailed).not.toHaveBeenCalled();
  });
});
