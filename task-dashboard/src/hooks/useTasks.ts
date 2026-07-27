import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { apiPath } from "../lib/api";
import type { AuthCallbacks } from "../lib/api";
import { formatStatusLabel } from "../types";
import type { Task, TaskListResponse } from "../types";
import { useAuthRequest } from "./useAuthRequest";
import { useDebounce } from "./useDebounce";

type TaskStats = {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
};

const EMPTY_STATS: TaskStats = { total: 0, pending: 0, inProgress: 0, completed: 0 };

export function useTasks(token: string, callbacks: AuthCallbacks) {
  const request = useAuthRequest(callbacks);

  const [fetchedTasks, setTasks] = useState<Task[]>([]);
  const [fetchedTotalTasks, setTotalTasks] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(6);
  const [statusFilter, setStatusFilterValue] = useState("all");
  const [priorityFilter, setPriorityFilterValue] = useState("all");
  const [search, setSearchValue] = useState("");
  const [sortBy, setSortByValue] = useState("createdAt");
  const [sortOrder, setSortOrderValue] = useState("desc");
  const [dueDateFrom, setDueDateFromValue] = useState("");
  const [dueDateTo, setDueDateToValue] = useState("");
  const [loadingTasks, setLoadingTasks] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [newTags, setNewTags] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Global stats (unaffected by current page filters)
  const [fetchedStats, setStats] = useState<TaskStats>(EMPTY_STATS);
  const [statsVersion, setStatsVersion] = useState(0);
  const bumpStats = useCallback(() => setStatsVersion((v) => v + 1), []);

  // Debounce search so we don't fire an API call on every keystroke
  const debouncedSearch = useDebounce(search, 300);

  // A refresh swaps in a new access token, so depending on the raw string here
  // would refetch everything for no reason — only signed-in vs. out matters.
  const active = Boolean(token);

  // Derive the signed-out state instead of clearing it from an effect, so
  // logging out never leaves a stale row rendered for a frame.
  const tasks = active ? fetchedTasks : [];
  const totalTasks = active ? fetchedTotalTasks : 0;
  const stats = active ? fetchedStats : EMPTY_STATS;

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalTasks / pageSize)),
    [totalTasks, pageSize]
  );

  // A different filter means a different result set, so go back to page 1 as
  // part of the same update rather than correcting it afterwards.
  const setStatusFilter = useCallback((value: string) => {
    setStatusFilterValue(value);
    setPage(1);
  }, []);

  const setPriorityFilter = useCallback((value: string) => {
    setPriorityFilterValue(value);
    setPage(1);
  }, []);

  const setSearch = useCallback((value: string) => {
    setSearchValue(value);
    setPage(1);
  }, []);

  const setSortBy = useCallback((value: string) => {
    setSortByValue(value);
    setPage(1);
  }, []);

  const setSortOrder = useCallback((value: string) => {
    setSortOrderValue(value);
    setPage(1);
  }, []);

  const setDueDateFrom = useCallback((value: string) => {
    setDueDateFromValue(value);
    setPage(1);
  }, []);

  const setDueDateTo = useCallback((value: string) => {
    setDueDateToValue(value);
    setPage(1);
  }, []);

  // ─── Fetch global stats ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!active) return;

    let cancelled = false;

    const fetchStats = async () => {
      try {
        const response = await request(apiPath("/api/tasks/stats"), { method: "GET" });
        // An error body would otherwise land in `stats` and render as NaN.
        if (!response.ok) return;

        const data = (await response.json()) as TaskStats;
        if (!cancelled) setStats(data);
      } catch {
        // Stats are supplementary — leave the last known values in place.
      }
    };

    fetchStats();

    return () => {
      cancelled = true;
    };
  }, [active, statsVersion, request]);

  // ─── Fetch task list ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!active) return;

    const controller = new AbortController();

    const fetchTasks = async () => {
      try {
        setLoadingTasks(true);
        setErrorMessage("");

        const params = new URLSearchParams({
          page: String(page),
          limit: String(pageSize),
          sortBy,
          sortOrder,
        });

        if (debouncedSearch.trim()) params.set("q", debouncedSearch.trim());
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (priorityFilter !== "all") params.set("priority", priorityFilter);
        if (dueDateFrom) params.set("dueDateFrom", new Date(dueDateFrom).toISOString());
        if (dueDateTo) params.set("dueDateTo", new Date(dueDateTo).toISOString());

        const response = await request(apiPath(`/api/tasks?${params.toString()}`), {
          method: "GET",
          signal: controller.signal,
        });

        const data = (await response.json()) as TaskListResponse & { message?: string };

        // A 401 that survives `authFetch` means the refresh token was rejected
        // too, and the `onRefreshFailed` callback has already signed the user
        // out — so there is nothing left to do but report it.
        if (!response.ok) {
          throw new Error(data.message || "Failed to load tasks");
        }

        setTasks(data.items);
        setTotalTasks(data.pagination.total);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setErrorMessage((error as Error).message);
        }
      } finally {
        setLoadingTasks(false);
      }
    };

    fetchTasks();

    return () => controller.abort();
  }, [active, page, pageSize, statusFilter, priorityFilter, debouncedSearch, sortBy, sortOrder, dueDateFrom, dueDateTo, request]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleCreateTask = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;

    try {
      setErrorMessage("");
      setSuccessMessage("");

      const payload = {
        title: newTitle,
        description: newDescription,
        priority: newPriority,
        dueDate: newDueDate ? new Date(newDueDate).toISOString() : undefined,
        tags: newTags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      const response = await request(apiPath("/api/tasks"), {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as Task & { message?: string };

      if (!response.ok) {
        throw new Error(data.message || "Failed to create task");
      }

      setNewTitle("");
      setNewDescription("");
      setNewPriority("medium");
      setNewDueDate("");
      setNewTags("");
      setSuccessMessage(`Task "${data.title}" created`);
      setPage(1);
      setTasks((previous) => [data, ...previous].slice(0, pageSize));
      setTotalTasks((previous) => previous + 1);
      bumpStats();
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!token) return;

    try {
      const response = await request(apiPath(`/api/tasks/${taskId}`), {
        method: "DELETE",
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete task");
      }

      setTasks((previous) => previous.filter((task) => task._id !== taskId));
      setTotalTasks((previous) => Math.max(0, previous - 1));
      setSuccessMessage("Task deleted");
      bumpStats();
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  };

  const handleStatusChange = async (task: Task, status: Task["status"]) => {
    if (!token) return;

    try {
      const response = await request(apiPath(`/api/tasks/${task._id}`), {
        method: "PUT",
        body: JSON.stringify({ status }),
      });

      const data = (await response.json()) as Task & { message?: string };

      if (!response.ok) {
        throw new Error(data.message || "Failed to update task");
      }

      setTasks((previous) =>
        previous.map((currentTask) => (currentTask._id === task._id ? data : currentTask))
      );
      setSuccessMessage(`Task updated to ${formatStatusLabel(status)}`);
      bumpStats();
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  };

  const handleUpdateTask = async (
    taskId: string,
    data: Partial<Pick<Task, "title" | "description" | "priority" | "dueDate" | "tags">>
  ) => {
    if (!token) return;

    try {
      setErrorMessage("");
      const response = await request(apiPath(`/api/tasks/${taskId}`), {
        method: "PUT",
        body: JSON.stringify(data),
      });

      const updated = (await response.json()) as Task & { message?: string };

      if (!response.ok) {
        throw new Error(updated.message || "Failed to update task");
      }

      setTasks((previous) =>
        previous.map((task) => (task._id === taskId ? updated : task))
      );
      setSuccessMessage("Task updated");
      bumpStats();
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  };

  return {
    // task list
    tasks,
    totalTasks,
    totalPages,
    stats,
    loadingTasks,
    // pagination
    page,
    setPage,
    pageSize,
    // filters
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    search,
    setSearch,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    dueDateFrom,
    setDueDateFrom,
    dueDateTo,
    setDueDateTo,
    // create form
    newTitle,
    setNewTitle,
    newDescription,
    setNewDescription,
    newPriority,
    setNewPriority,
    newDueDate,
    setNewDueDate,
    newTags,
    setNewTags,
    // messages
    errorMessage,
    successMessage,
    // handlers
    handleCreateTask,
    handleDeleteTask,
    handleStatusChange,
    handleUpdateTask,
  };
}
