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
    <section className="panel">
      <h2>Create Task</h2>
      <form className="create-form" onSubmit={onSubmit}>
        <label>
          Title
          <input
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            required
          />
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
          <input
            type="date"
            value={newDueDate}
            onChange={(event) => setNewDueDate(event.target.value)}
          />
        </label>

        <label>
          Tags (comma separated)
          <input
            value={newTags}
            onChange={(event) => setNewTags(event.target.value)}
            placeholder="api, demo"
          />
        </label>

        <button type="submit">Create</button>
      </form>
    </section>
  );
}
