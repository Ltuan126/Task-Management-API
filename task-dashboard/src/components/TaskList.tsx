import { TaskCard } from "./TaskCard";
import type { Task } from "../types";

type Props = {
  tasks: Task[];
  totalTasks: number;
  loadingTasks: boolean;
  errorMessage: string;
  successMessage: string;
  page: number;
  totalPages: number;
  setPage: (updater: (current: number) => number) => void;
  onStatusChange: (task: Task, status: Task["status"]) => void;
  onDelete: (taskId: string) => void;
};

export function TaskList({
  tasks,
  totalTasks,
  loadingTasks,
  errorMessage,
  successMessage,
  page,
  totalPages,
  setPage,
  onStatusChange,
  onDelete,
}: Props) {
  return (
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
            <TaskCard
              key={task._id}
              task={task}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      <div className="pagination-row">
        <button
          type="button"
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={page === 1}
        >
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
  );
}
