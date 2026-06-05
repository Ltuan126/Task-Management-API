import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { apiPath, createHeaders } from "../lib/api";
import { formatStatusLabel } from "../types";
import type { Task, TaskListResponse } from "../types";
import { useDebounce } from "./useDebounce";

type TaskStats = {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
};

const EMPTY_STATS: TaskStats = { total: 0, pending: 0, inProgress: 0, completed: 0 };

export function useTasks(token: string, onTokenExpired?: () => void) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(6);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [dueDateFrom, setDueDateFrom] = useState("");
  const [dueDateTo, setDueDateTo] = useState("");
  const [loadingTasks, setLoadingTasks] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [newTags, setNewTags] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Global stats (unaffected by current page filters)
  const [stats, setStats] = useState<TaskStats>(EMPTY_STATS);
  const [statsVersion, setStatsVersion] = useState(0);
  const bumpStats = useCallback(() => setStatsVersion((v) => v + 1), []);

  // Debounce search so we don't fire an API call on every keystroke
  const debouncedSearch = useDebounce(search, 300);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalTasks / pageSize)),
    [totalTasks, pageSize]
  );

  // ─── Fetch global stats ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      setStats(EMPTY_STATS);
      return;
    }

    let cancelled = false;

    fetch(apiPath("/api/tasks/stats"), { headers: createHeaders(token) })
      .then((r) => r.json())
      .then((data: TaskStats) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [token, statsVersion]);

  // ─── Fetch task list ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      setTasks([]);
      setTotalTasks(0);
      return;
    }

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

        const response = await fetch(apiPath(`/api/tasks?${params.toString()}`), {
          method: "GET",
          headers: createHeaders(token),
          signal: controller.signal,
        });

        const data = (await response.json()) as TaskListResponse & { message?: string };

        if (!response.ok) {
          if (response.status === 401) {
            onTokenExpired?.();
            return;
          }
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
  }, [token, page, pageSize, statusFilter, priorityFilter, debouncedSearch, sortBy, sortOrder, dueDateFrom, dueDateTo, onTokenExpired]);

  // Reset to page 1 when search changes so results are consistent
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, priorityFilter, sortBy, sortOrder, dueDateFrom, dueDateTo]);

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

      const response = await fetch(apiPath("/api/tasks"), {
        method: "POST",
        headers: createHeaders(token),
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
      const response = await fetch(apiPath(`/api/tasks/${taskId}`), {
        method: "DELETE",
        headers: createHeaders(token),
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
      const response = await fetch(apiPath(`/api/tasks/${task._id}`), {
        method: "PUT",
        headers: createHeaders(token),
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
      const response = await fetch(apiPath(`/api/tasks/${taskId}`), {
        method: "PUT",
        headers: createHeaders(token),
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
