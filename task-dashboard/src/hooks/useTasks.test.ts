import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useTasks } from "./useTasks";
import type { AuthCallbacks } from "../lib/api";

const task = (id: string, title: string) => ({
  _id: id,
  title,
  description: "",
  status: "pending",
  priority: "medium",
  tags: [],
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
});

const taskList = (items: ReturnType<typeof task>[], total = items.length) => ({
  items,
  pagination: { total, page: 1, limit: 6, totalPages: Math.max(1, Math.ceil(total / 6)) },
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

let accessToken = "valid-token";

const makeCallbacks = (overrides: Partial<AuthCallbacks> = {}): AuthCallbacks => ({
  getAccessToken: () => accessToken,
  getRefreshToken: () => "refresh-token",
  onTokensRefreshed: vi.fn((next: string) => {
    accessToken = next;
  }),
  onRefreshFailed: vi.fn(),
  ...overrides,
});

/** URLs of the task-list requests, in order, ignoring stats/analytics traffic. */
const listRequests = (fetchMock: Mock) =>
  fetchMock.mock.calls.map((call) => String(call[0])).filter((url) => url.includes("/api/tasks?"));

beforeEach(() => {
  accessToken = "valid-token";
});

describe("useTasks", () => {
  it("loads tasks and stats for a signed-in user", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.includes("/stats")
          ? json({ total: 1, pending: 1, inProgress: 0, completed: 0 })
          : json(taskList([task("t1", "Write tests")]))
      )
    );

    const { result } = renderHook(() => useTasks("valid-token", makeCallbacks()));

    await waitFor(() => expect(result.current.tasks).toHaveLength(1));
    expect(result.current.tasks[0].title).toBe("Write tests");
    expect(result.current.totalTasks).toBe(1);
    expect(result.current.stats.pending).toBe(1);
  });

  it("refreshes an expired access token and retries instead of signing the user out", async () => {
    // The regression this guards: before authFetch was wired in, this 401 ended
    // the session 15 minutes into a working day.
    accessToken = "expired-token";
    const fetchMock = vi.fn(async (url: string, options?: RequestInit) => {
      if (url.includes("/api/auth/refresh")) {
        return json({ token: "fresh-token", refreshToken: "fresh-refresh" });
      }
      const bearer = new Headers(options?.headers).get("Authorization");
      if (bearer !== "Bearer fresh-token") {
        return json({ message: "jwt expired" }, 401);
      }
      return url.includes("/stats")
        ? json({ total: 1, pending: 1, inProgress: 0, completed: 0 })
        : json(taskList([task("t1", "Survived expiry")]));
    });
    vi.stubGlobal("fetch", fetchMock);

    const callbacks = makeCallbacks();
    const { result } = renderHook(() => useTasks("expired-token", callbacks));

    await waitFor(() => expect(result.current.tasks).toHaveLength(1));
    expect(result.current.tasks[0].title).toBe("Survived expiry");
    expect(result.current.errorMessage).toBe("");
    expect(callbacks.onTokensRefreshed).toHaveBeenCalledWith("fresh-token", "fresh-refresh");
    expect(callbacks.onRefreshFailed).not.toHaveBeenCalled();
  });

  it("signs the user out when the refresh token is rejected too", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.includes("/api/auth/refresh")
          ? json({ message: "Invalid refresh token" }, 401)
          : json({ message: "Unauthorized" }, 401)
      )
    );

    const callbacks = makeCallbacks();
    renderHook(() => useTasks("expired-token", callbacks));

    await waitFor(() => expect(callbacks.onRefreshFailed).toHaveBeenCalled());
  });

  it("resets to page 1 in the same request when a filter changes", async () => {
    const fetchMock = vi.fn(async (url: string) =>
      url.includes("/stats")
        ? json({ total: 0, pending: 0, inProgress: 0, completed: 0 })
        : json(taskList([], 20))
    );
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useTasks("valid-token", makeCallbacks()));
    await waitFor(() => expect(listRequests(fetchMock)).toHaveLength(1));

    act(() => result.current.setPage(2));
    await waitFor(() => expect(listRequests(fetchMock)).toHaveLength(2));
    expect(listRequests(fetchMock)[1]).toContain("page=2");

    act(() => result.current.setStatusFilter("pending"));
    await waitFor(() => expect(listRequests(fetchMock)).toHaveLength(3));

    // One request, already on page 1 — the old reset-from-an-effect version
    // fetched page 2 with the new filter first, then corrected itself.
    expect(result.current.page).toBe(1);
    expect(listRequests(fetchMock)[2]).toContain("page=1");
    expect(listRequests(fetchMock)[2]).toContain("status=pending");
    expect(listRequests(fetchMock)).toHaveLength(3);
  });

  it("shows nothing once the user is signed out", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url.includes("/stats")
          ? json({ total: 3, pending: 3, inProgress: 0, completed: 0 })
          : json(taskList([task("t1", "Only while signed in")], 3))
      )
    );

    const { result, rerender } = renderHook(
      (props: { token: string }) => useTasks(props.token, makeCallbacks()),
      { initialProps: { token: "valid-token" } }
    );

    await waitFor(() => expect(result.current.tasks).toHaveLength(1));

    rerender({ token: "" });

    // Derived, not cleared from an effect — so it is empty on the first render
    // after logout rather than a frame later.
    expect(result.current.tasks).toEqual([]);
    expect(result.current.totalTasks).toBe(0);
    expect(result.current.stats).toEqual({ total: 0, pending: 0, inProgress: 0, completed: 0 });
  });

  it("sends mutations through the refreshing fetch", async () => {
    accessToken = "expired-token";
    const fetchMock = vi.fn(async (url: string, options?: RequestInit) => {
      if (url.includes("/api/auth/refresh")) {
        return json({ token: "fresh-token", refreshToken: "fresh-refresh" });
      }
      if (url.includes("/stats")) {
        return json({ total: 1, pending: 1, inProgress: 0, completed: 0 });
      }
      if (options?.method === "DELETE") {
        return new Headers(options.headers).get("Authorization") === "Bearer fresh-token"
          ? json({ message: "Task deleted" })
          : json({ message: "jwt expired" }, 401);
      }
      return json(taskList([task("t1", "Doomed")]));
    });
    vi.stubGlobal("fetch", fetchMock);

    const callbacks = makeCallbacks();
    const { result } = renderHook(() => useTasks("expired-token", callbacks));
    await waitFor(() => expect(result.current.tasks).toHaveLength(1));

    await act(() => result.current.handleDeleteTask("t1"));

    expect(result.current.tasks).toEqual([]);
    expect(result.current.successMessage).toBe("Task deleted");
    expect(result.current.errorMessage).toBe("");
    expect(callbacks.onRefreshFailed).not.toHaveBeenCalled();
  });
});
