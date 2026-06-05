type TaskStats = {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
};

type Props = {
  totalTasks: number; // filtered count (matching current page filters)
  stats: TaskStats;   // global counts from /api/tasks/stats
};

export function HeroPanel({ totalTasks, stats }: Props) {
  return (
    <section className="hero-panel">
      <div className="hero-copy">
        <p className="eyebrow">Task orchestration</p>
        <h1>Task Command Center</h1>
        <p className="hero-lead">
          A cleaner workspace to review ownership, adjust status, and keep priorities visible at a
          glance.
        </p>
      </div>

      <div className="hero-stats" aria-label="Task summary">
        <article className="stat-card stat-card--wide">
          <span>Filtered tasks</span>
          <strong>{totalTasks}</strong>
          <small>Matching current filters</small>
        </article>

        <article className="stat-card stat-card--wide">
          <span>All your tasks</span>
          <strong>{stats.total}</strong>
          <small>Across all filters</small>
        </article>

        <article className="stat-card stat-card--subtle stat-card--pending">
          <span>Pending</span>
          <strong>{stats.pending}</strong>
          <small>Needs attention</small>
        </article>

        <article className="stat-card stat-card--subtle stat-card--progress">
          <span>In progress</span>
          <strong>{stats.inProgress}</strong>
          <small>Currently moving</small>
        </article>

        <article className="stat-card stat-card--subtle stat-card--done">
          <span>Completed</span>
          <strong>{stats.completed}</strong>
          <small>Recently closed</small>
        </article>
      </div>
    </section>
  );
}
