import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { apiPath, createHeaders } from "../lib/api";
import { formatStatusLabel } from "../types";
import type { Task, TaskListResponse } from "../types";

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

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalTasks / pageSize)),
    [totalTasks, pageSize]
  );

  const taskSummary = useMemo(
    () => ({
      visible: tasks.length,
      pending: tasks.filter((t) => t.status === "pending").length,
      inProgress: tasks.filter((t) => t.status === "in-progress").length,
      completed: tasks.filter((t) => t.status === "completed").length,
    }),
    [tasks]
  );

  // Fetch tasks whenever token or any filter/pagination value changes
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

        if (search.trim()) params.set("q", search.trim());
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
  }, [token, page, pageSize, statusFilter, priorityFilter, search, sortBy, sortOrder, dueDateFrom, dueDateTo, onTokenExpired]);

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
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  };

  return {
    // task list
    tasks,
    totalTasks,
    totalPages,
    taskSummary,
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
  };
}
