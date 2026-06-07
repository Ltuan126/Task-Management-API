import type { FormEvent } from "react";

type Props = {
  newTitle: string;
  setNewTitle: (value: string) => void;
  newDescription: string;
  setNewDescription: (value: string) => void;
  newPriority: string;
  setNewPriority: (value: string) => void;
  newDueDate: string;
  setNewDueDate: (value: string) => void;
  newTags: string;
  setNewTags: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
};

export function CreateTaskForm({
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
  onSubmit,
}: Props) {
  return (
    <section className="panel create-panel">
      <div className="create-panel__header">
        <div>
          <h2>⚡ New Task</h2>
          <p className="create-panel__sub">Capture what needs to be done</p>
        </div>
      </div>

      <form className="create-form-v2" onSubmit={onSubmit}>
        {/* Title — most prominent field */}
        <input
          className="create-title-input"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="What needs to be done?"
          required
          autoComplete="off"
        />

        {/* Description */}
        <input
          className="create-desc-input"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          placeholder="Add a description (optional)"
          autoComplete="off"
        />

        {/* Meta row: priority · due date · tags · submit */}
        <div className="create-meta-row">
          <label className="create-meta-field">
            <span>Priority</span>
            <select value={newPriority} onChange={(e) => setNewPriority(e.target.value)}>
              <option value="low">🟢 Low</option>
              <option value="medium">🟡 Medium</option>
              <option value="high">🔴 High</option>
            </select>
          </label>

          <label className="create-meta-field">
            <span>Due Date</span>
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
            />
          </label>

          <label className="create-meta-field create-meta-field--wide">
            <span>Tags</span>
            <input
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              placeholder="api, backend, urgent…"
              autoComplete="off"
            />
          </label>

          <button type="submit" className="create-submit-btn" disabled={!newTitle.trim()}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
            Create
          </button>
        </div>
      </form>
    </section>
  );
}
