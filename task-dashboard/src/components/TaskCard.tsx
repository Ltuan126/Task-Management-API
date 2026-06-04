import { statusOptions, formatStatusLabel } from "../types";
import type { Task } from "../types";

type Props = {
  task: Task;
  onStatusChange: (task: Task, status: Task["status"]) => void;
  onDelete: (taskId: string) => void;
};

export function TaskCard({ task, onStatusChange, onDelete }: Props) {
  return (
    <article className={`task-card task-card--${task.status}`}>
      <div className="task-title-row">
        <h3>{task.title}</h3>
        <div className="task-badges">
          <span className={`status ${task.status}`}>{formatStatusLabel(task.status)}</span>
          <span className={`priority priority-${task.priority}`}>{task.priority}</span>
        </div>
      </div>

      {task.description && <p>{task.description}</p>}

      <div className="task-meta">
        <span>Priority: {task.priority}</span>
        <span>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Not set"}</span>
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
        <label className="status-control">
          Status
          <select
            value={task.status}
            onChange={(event) => onStatusChange(task, event.target.value as Task["status"])}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button className="danger" type="button" onClick={() => onDelete(task._id)}>
          Delete
        </button>
      </div>
    </article>
  );
}
