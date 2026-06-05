import { useState } from "react";
import { statusOptions, formatStatusLabel } from "../types";
import type { Task } from "../types";

type Props = {
  task: Task;
  onStatusChange: (task: Task, status: Task["status"]) => void;
  onUpdate: (
    taskId: string,
    data: Partial<Pick<Task, "title" | "description" | "priority" | "dueDate" | "tags">>
  ) => void;
  onDelete: (taskId: string) => void;
};

/** Convert ISO date string → YYYY-MM-DD for <input type="date"> */
const toDateInputValue = (iso?: string) => (iso ? iso.split("T")[0] : "");

export function TaskCard({ task, onStatusChange, onUpdate, onDelete }: Props) {
  const [isEditing, setIsEditing] = useState(false);

  // Edit form state — initialised from task on first render
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description ?? "");
  const [editPriority, setEditPriority] = useState<Task["priority"]>(task.priority);
  const [editDueDate, setEditDueDate] = useState(toDateInputValue(task.dueDate));
  const [editTags, setEditTags] = useState(task.tags.join(", "));

  const openEdit = () => {
    // Re-sync local state with latest task data before opening
    setEditTitle(task.title);
    setEditDescription(task.description ?? "");
    setEditPriority(task.priority);
    setEditDueDate(toDateInputValue(task.dueDate));
    setEditTags(task.tags.join(", "));
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editTitle.trim()) return; // basic guard
    onUpdate(task._id, {
      title: editTitle.trim(),
      description: editDescription,
      priority: editPriority,
      dueDate: editDueDate ? new Date(editDueDate).toISOString() : undefined,
      tags: editTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
    setIsEditing(false);
  };

  const handleCancel = () => setIsEditing(false);

  const handleDelete = () => {
    if (window.confirm(`Delete "${task.title}"?\nThis action cannot be undone.`)) {
      onDelete(task._id);
    }
  };

  // ─── Edit mode ───────────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <article className={`task-card task-card--${task.status} task-card--editing`}>
        <p className="task-card__edit-label">Editing task</p>

        <label className="task-card__field">
          Title
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            autoFocus
          />
        </label>

        <label className="task-card__field">
          Description
          <input
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Optional"
          />
        </label>

        <label className="task-card__field">
          Priority
          <select value={editPriority} onChange={(e) => setEditPriority(e.target.value as Task["priority"])}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>

        <label className="task-card__field">
          Due Date
          <input
            type="date"
            value={editDueDate}
            onChange={(e) => setEditDueDate(e.target.value)}
          />
        </label>

        <label className="task-card__field">
          Tags (comma separated)
          <input
            value={editTags}
            onChange={(e) => setEditTags(e.target.value)}
            placeholder="api, demo"
          />
        </label>

        <div className="task-card__edit-actions">
          <button type="button" onClick={handleSave} disabled={!editTitle.trim()}>
            Save
          </button>
          <button type="button" className="secondary" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </article>
    );
  }

  // ─── View mode ───────────────────────────────────────────────────────────────
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

        <div className="task-action-buttons">
          <button type="button" className="secondary" onClick={openEdit}>
            Edit
          </button>
          <button className="danger" type="button" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
