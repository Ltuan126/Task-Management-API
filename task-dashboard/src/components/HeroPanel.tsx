type TaskSummary = {
  visible: number;
  pending: number;
  inProgress: number;
  completed: number;
};

type Props = {
  totalTasks: number;
  taskSummary: TaskSummary;
};

export function HeroPanel({ totalTasks, taskSummary }: Props) {
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
          <span>Total tasks</span>
          <strong>{totalTasks}</strong>
          <small>Matching current filters</small>
        </article>

        <article className="stat-card">
          <span>Visible</span>
          <strong>{taskSummary.visible}</strong>
          <small>On this page</small>
        </article>

        <article className="stat-card stat-card--subtle stat-card--pending">
          <span>Pending</span>
          <strong>{taskSummary.pending}</strong>
          <small>Needs attention</small>
        </article>

        <article className="stat-card stat-card--subtle stat-card--progress">
          <span>In progress</span>
          <strong>{taskSummary.inProgress}</strong>
          <small>Currently moving</small>
        </article>

        <article className="stat-card stat-card--subtle stat-card--done">
          <span>Completed</span>
          <strong>{taskSummary.completed}</strong>
          <small>Recently closed</small>
        </article>
      </div>
    </section>
  );
}
