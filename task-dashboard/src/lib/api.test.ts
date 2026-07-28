import { describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { apiPath, authFetch, createHeaders } from "./api";
import type { AuthCallbacks } from "./api";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const makeCallbacks = (overrides: Partial<AuthCallbacks> = {}): AuthCallbacks => ({
  getAccessToken: () => "expired-token",
  getRefreshToken: () => "refresh-token",
  onTokensRefreshed: vi.fn(),
  onRefreshFailed: vi.fn(),
  ...overrides,
});

/** Installs a fetch stub and returns it, typed for assertions. */
const stubFetch = (impl: (url: string, options?: RequestInit) => Promise<Response>) => {
  const fetchMock = vi.fn(impl);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock as Mock;
};

const urlOf = (call: unknown[]) => String(call[0]);
const optionsOf = (call: unknown[]) => call[1] as RequestInit;

describe("createHeaders", () => {
  it("sends the token as a bearer credential", () => {
    expect(createHeaders("abc")).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer abc",
    });
  });
});

describe("authFetch", () => {
  it("passes a successful response straight through without refreshing", async () => {
    const fetchMock = stubFetch(async () => json({ ok: true }));
    const callbacks = makeCallbacks();

    const response = await authFetch(apiPath("/api/tasks"), { method: "GET" }, callbacks);

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(callbacks.onTokensRefreshed).not.toHaveBeenCalled();
    expect(callbacks.onRefreshFailed).not.toHaveBeenCalled();
  });

  it("does not treat a non-401 error as an expired token", async () => {
    // 403 is the server refusing an action the user may never take — retrying
    // with a fresh token would just fail again.
    const fetchMock = stubFetch(async () => json({ message: "Forbidden" }, 403));
    const callbacks = makeCallbacks();

    const response = await authFetch(apiPath("/api/admin/users"), {}, callbacks);

    expect(response.status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(callbacks.onRefreshFailed).not.toHaveBeenCalled();
  });

  it("refreshes on 401 and retries the original request with the new token", async () => {
    const fetchMock = stubFetch(async (url) => {
      if (url.endsWith("/api/auth/refresh")) {
        return json({ token: "fresh-access", refreshToken: "fresh-refresh" });
      }
      // The first attempt carries the stale token; the retry carries the new one.
      const attempt = fetchMock.mock.calls.length;
      return attempt === 1 ? json({ message: "jwt expired" }, 401) : json({ items: [] });
    });
    const callbacks = makeCallbacks();

    const response = await authFetch(
      apiPath("/api/tasks"),
      { method: "GET", body: JSON.stringify({ keep: "me" }) },
      callbacks
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ items: [] });

    const [first, refresh, retry] = fetchMock.mock.calls;
    expect(urlOf(first)).toContain("/api/tasks");
    expect(urlOf(refresh)).toContain("/api/auth/refresh");
    expect(urlOf(retry)).toContain("/api/tasks");

    // The refresh call must send the refresh token and no bearer credential.
    expect(JSON.parse(String(optionsOf(refresh).body))).toEqual({
      refreshToken: "refresh-token",
    });

    // The retry keeps the original method and body but swaps the token.
    expect(optionsOf(retry).method).toBe("GET");
    expect(optionsOf(retry).body).toBe(JSON.stringify({ keep: "me" }));
    expect(new Headers(optionsOf(retry).headers).get("Authorization")).toBe(
      "Bearer fresh-access"
    );

    expect(callbacks.onTokensRefreshed).toHaveBeenCalledWith("fresh-access", "fresh-refresh");
    expect(callbacks.onRefreshFailed).not.toHaveBeenCalled();
  });

  it("gives up without calling the refresh endpoint when no refresh token is stored", async () => {
    const fetchMock = stubFetch(async () => json({ message: "Unauthorized" }, 401));
    const callbacks = makeCallbacks({ getRefreshToken: () => "" });

    const response = await authFetch(apiPath("/api/tasks"), {}, callbacks);

    expect(response.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(callbacks.onRefreshFailed).toHaveBeenCalledTimes(1);
    expect(callbacks.onTokensRefreshed).not.toHaveBeenCalled();
  });

  it("signs the user out when the refresh token is rejected", async () => {
    // A rotated-away or revoked refresh token: the session is genuinely over.
    stubFetch(async (url) =>
      url.endsWith("/api/auth/refresh")
        ? json({ message: "Invalid refresh token" }, 401)
        : json({ message: "jwt expired" }, 401)
    );
    const callbacks = makeCallbacks();

    const response = await authFetch(apiPath("/api/tasks"), {}, callbacks);

    expect(response.status).toBe(401);
    expect(callbacks.onRefreshFailed).toHaveBeenCalledTimes(1);
    expect(callbacks.onTokensRefreshed).not.toHaveBeenCalled();
  });

  it("signs the user out when the refresh request itself throws", async () => {
    stubFetch(async (url) => {
      if (url.endsWith("/api/auth/refresh")) throw new TypeError("Failed to fetch");
      return json({ message: "jwt expired" }, 401);
    });
    const callbacks = makeCallbacks();

    const response = await authFetch(apiPath("/api/tasks"), {}, callbacks);

    expect(response.status).toBe(401);
    expect(callbacks.onRefreshFailed).toHaveBeenCalledTimes(1);
  });
});
