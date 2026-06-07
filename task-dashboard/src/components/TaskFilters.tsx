type Props = {
  search: string;
  setSearch: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  priorityFilter: string;
  setPriorityFilter: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  sortOrder: string;
  setSortOrder: (value: string) => void;
  dueDateFrom: string;
  setDueDateFrom: (value: string) => void;
  dueDateTo: string;
  setDueDateTo: (value: string) => void;
};

export function TaskFilters({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  dueDateFrom,
  setDueDateFrom,
  dueDateTo,
  setDueDateTo,
}: Props) {
  return (
    <section className="panel">
      <h2>⌘ Filters</h2>
      <div className="filter-grid">
        <label>
          Search
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="title or description"
          />
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
          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
          >
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
          <input
            type="date"
            value={dueDateFrom}
            onChange={(event) => setDueDateFrom(event.target.value)}
          />
        </label>

        <label>
          Due Date To
          <input
            type="date"
            value={dueDateTo}
            onChange={(event) => setDueDateTo(event.target.value)}
          />
        </label>
      </div>
    </section>
  );
}
