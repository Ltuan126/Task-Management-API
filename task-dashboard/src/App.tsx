import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

type User = {
  id: string;
  name: string;
  email: string;
};

type AuthResponse = {
  user: User;
  token: string;
};

type Task = {
  _id: string;
  title: string;
  description?: string;
  status: "pending" | "in-progress" | "completed";
  priority: "low" | "medium" | "high";
  tags: string[];
  dueDate?: string;
  createdAt: string;
};

type TaskListResponse = {
  items: Task[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

const TOKEN_KEY = "task_dashboard_token";
const USER_KEY = "task_dashboard_user";

const createHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

const cycleStatus = (status: Task["status"]): Task["status"] => {
  if (status === "pending") return "in-progress";
  if (status === "in-progress") return "completed";
  return "pending";
};

function App() {
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

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalTasks / pageSize)), [totalTasks, pageSize]);

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

        const response = await fetch(`/api/tasks?${params.toString()}`, {
          method: "GET",
          headers: createHeaders(token),
          signal: controller.signal,
        });

        const data = (await response.json()) as TaskListResponse & { message?: string };

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
  }, [token, page, pageSize, statusFilter, priorityFilter, search, sortBy, sortOrder, dueDateFrom, dueDateTo]);

  const handleAuthSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setAuthLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const endpoint = isRegisterMode ? "/api/auth/register" : "/api/auth/login";
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
      setPage(1);
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

      const response = await fetch("/api/tasks", {
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
      setSuccessMessage(`Task \"${data.title}\" created`);
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
      const response = await fetch(`/api/tasks/${taskId}`, {
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

  const handleStatusChange = async (task: Task) => {
    if (!token) return;

    const nextStatus = cycleStatus(task.status);

    try {
      const response = await fetch(`/api/tasks/${task._id}`, {
        method: "PUT",
        headers: createHeaders(token),
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = (await response.json()) as Task & { message?: string };

      if (!response.ok) {
        throw new Error(data.message || "Failed to update task");
      }

      setTasks((previous) =>
        previous.map((currentTask) => (currentTask._id === task._id ? data : currentTask))
      );
      setSuccessMessage(`Task updated to ${nextStatus}`);
    } catch (error) {
      setErrorMessage((error as Error).message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken("");
    setUser(null);
    setTasks([]);
    setTotalTasks(0);
    setSuccessMessage("Logged out");
  };

  if (!token || !user) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <h1>Task Command Center</h1>
          <p>Sign in to demo your secured task API with live filters and ownership isolation.</p>

          <form onSubmit={handleAuthSubmit} className="auth-form">
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

          {errorMessage && <p className="banner error">{errorMessage}</p>}
          {successMessage && <p className="banner success">{successMessage}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard-shell">
      <header className="top-bar">
        <div>
          <h1>Task Command Center</h1>
          <p>
            Welcome back, <strong>{user.name}</strong>.
          </p>
        </div>
        <button className="secondary" type="button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <section className="panel">
        <h2>Create Task</h2>
        <form className="create-form" onSubmit={handleCreateTask}>
          <label>
            Title
            <input value={newTitle} onChange={(event) => setNewTitle(event.target.value)} required />
          </label>

          <label>
            Description
            <input
              value={newDescription}
              onChange={(event) => setNewDescription(event.target.value)}
              placeholder="Optional"
            />
          </label>

          <label>
            Priority
            <select value={newPriority} onChange={(event) => setNewPriority(event.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>

          <label>
            Due Date
            <input type="date" value={newDueDate} onChange={(event) => setNewDueDate(event.target.value)} />
          </label>

          <label>
            Tags (comma separated)
            <input value={newTags} onChange={(event) => setNewTags(event.target.value)} placeholder="api, demo" />
          </label>

          <button type="submit">Create</button>
        </form>
      </section>

      <section className="panel">
        <h2>Task Filters</h2>
        <div className="filter-grid">
          <label>
            Search
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="title or description" />
          </label>

          <label>
            Status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </label>

          <label>
            Priority
            <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
              <option value="all">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>

          <label>
            Sort By
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="createdAt">Created Time</option>
              <option value="updatedAt">Updated Time</option>
              <option value="title">Title</option>
              <option value="status">Status</option>
              <option value="dueDate">Due Date</option>
            </select>
          </label>

          <label>
            Sort Order
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </label>

          <label>
            Due Date From
            <input type="date" value={dueDateFrom} onChange={(event) => setDueDateFrom(event.target.value)} />
          </label>

          <label>
            Due Date To
            <input type="date" value={dueDateTo} onChange={(event) => setDueDateTo(event.target.value)} />
          </label>
        </div>
      </section>

      <section className="panel">
        <h2>Tasks ({totalTasks})</h2>

        {errorMessage && <p className="banner error">{errorMessage}</p>}
        {successMessage && <p className="banner success">{successMessage}</p>}

        {loadingTasks ? (
          <p className="muted">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="muted">No tasks found with current filters.</p>
        ) : (
          <div className="task-grid">
            {tasks.map((task) => (
              <article className="task-card" key={task._id}>
                <div className="task-title-row">
                  <h3>{task.title}</h3>
                  <span className={`status ${task.status}`}>{task.status}</span>
                </div>

                {task.description && <p>{task.description}</p>}

                <div className="task-meta">
                  <span>Priority: {task.priority}</span>
                  <span>
                    Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Not set"}
                  </span>
                </div>

                {task.tags.length > 0 && (
                  <div className="tag-row">
                    {task.tags.map((tag) => (
                      <span className="tag" key={`${task._id}-${tag}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="task-actions">
                  <button type="button" onClick={() => handleStatusChange(task)}>
                    Next Status
                  </button>
                  <button className="danger" type="button" onClick={() => handleDeleteTask(task._id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="pagination-row">
          <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>
            Prev
          </button>
          <span>
            Page {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      </section>
    </main>
  );
}

export default App;
