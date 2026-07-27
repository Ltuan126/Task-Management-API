import { auditActionTone, auditActions, formatAuditAction, roleOptions } from "../types";
import type { AdminUser, AuditLogEntry, Role } from "../types";

type Props = {
  currentUserId: string;
  // users
  users: AdminUser[];
  usersTotal: number;
  usersPage: number;
  usersTotalPages: number;
  setUsersPage: (updater: (current: number) => number) => void;
  loadingUsers: boolean;
  savingUserId: string;
  adminCount: number;
  onRoleChange: (user: AdminUser, role: Role) => void;
  // audit
  logs: AuditLogEntry[];
  logsTotal: number;
  logsPage: number;
  logsTotalPages: number;
  setLogsPage: (updater: (current: number) => number) => void;
  loadingLogs: boolean;
  actionFilter: string;
  setActionFilter: (value: string) => void;
  emailFilter: string;
  setEmailFilter: (value: string) => void;
  // shared
  errorMessage: string;
  successMessage: string;
};

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

/** Render the varying `details` blob as compact `key: value` pairs. */
const formatDetails = (details?: Record<string, unknown>) => {
  if (!details) return "";
  return Object.entries(details)
    .map(([key, value]) => `${key}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`)
    .join(" · ");
};

export function AdminPanel({
  currentUserId,
  users,
  usersTotal,
  usersPage,
  usersTotalPages,
  setUsersPage,
  loadingUsers,
  savingUserId,
  adminCount,
  onRoleChange,
  logs,
  logsTotal,
  logsPage,
  logsTotalPages,
  setLogsPage,
  loadingLogs,
  actionFilter,
  setActionFilter,
  emailFilter,
  setEmailFilter,
  errorMessage,
  successMessage,
}: Props) {
  return (
    <section className="panel admin-panel">
      <header className="admin-header">
        <div>
          <h2>◆ Admin Console</h2>
          <p className="admin-sub">
            Role management and the audit trail. Visible to administrators only.
          </p>
        </div>
        <span className="admin-badge" title="Admins on this page">
          {adminCount} admin{adminCount === 1 ? "" : "s"} / {usersTotal} user
          {usersTotal === 1 ? "" : "s"}
        </span>
      </header>

      {errorMessage && (
        <p className="banner error" role="alert" aria-live="assertive">
          {errorMessage}
        </p>
      )}
      {successMessage && (
        <p className="banner success" role="status" aria-live="polite">
          {successMessage}
        </p>
      )}

      {/* ─── User directory ──────────────────────────────────────────────── */}
      <div className="admin-section">
        <h3>Users ({usersTotal})</h3>

        {loadingUsers ? (
          <p className="muted">Loading users…</p>
        ) : users.length === 0 ? (
          <p className="muted">No users found.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Joined</th>
                  <th scope="col">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isSelf = user._id === currentUserId;
                  return (
                    <tr key={user._id}>
                      <td>
                        {user.name}
                        {isSelf && <span className="admin-you">you</span>}
                      </td>
                      <td className="admin-email">{user.email}</td>
                      <td className="admin-date">{formatDateTime(user.createdAt)}</td>
                      <td>
                        <label className="admin-role-cell">
                          <span className="sr-only">Role for {user.email}</span>
                          <select
                            value={user.role}
                            disabled={isSelf || savingUserId === user._id}
                            // The server rejects self-demotion too; this only
                            // avoids offering an action that cannot succeed.
                            title={isSelf ? "You cannot change your own role" : undefined}
                            onChange={(event) => onRoleChange(user, event.target.value as Role)}
                            className={`admin-role admin-role--${user.role}`}
                          >
                            {roleOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {usersTotalPages > 1 && (
          <div className="pagination-row">
            <button
              type="button"
              onClick={() => setUsersPage((current) => Math.max(1, current - 1))}
              disabled={usersPage === 1}
            >
              Prev
            </button>
            <span>
              Page {usersPage} / {usersTotalPages}
            </span>
            <button
              type="button"
              onClick={() => setUsersPage((current) => Math.min(usersTotalPages, current + 1))}
              disabled={usersPage >= usersTotalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* ─── Audit trail ─────────────────────────────────────────────────── */}
      <div className="admin-section">
        <h3>Audit Trail ({logsTotal})</h3>

        <div className="admin-filters">
          <label>
            Action
            <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)}>
              <option value="all">All actions</option>
              {auditActions.map((action) => (
                <option key={action} value={action}>
                  {formatAuditAction(action)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Email
            <input
              type="search"
              value={emailFilter}
              placeholder="Filter by email…"
              onChange={(event) => setEmailFilter(event.target.value)}
            />
          </label>
        </div>

        {loadingLogs ? (
          <p className="muted">Loading audit trail…</p>
        ) : logs.length === 0 ? (
          <p className="muted">No audit entries match these filters.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">When</th>
                  <th scope="col">Action</th>
                  <th scope="col">Actor</th>
                  <th scope="col">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td className="admin-date">{formatDateTime(log.createdAt)}</td>
                    <td>
                      <span className={`audit-action audit-action--${auditActionTone(log.action)}`}>
                        {formatAuditAction(log.action)}
                      </span>
                    </td>
                    <td className="admin-email">{log.email || "—"}</td>
                    <td className="admin-details" title={formatDetails(log.details)}>
                      {formatDetails(log.details) || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {logsTotalPages > 1 && (
          <div className="pagination-row">
            <button
              type="button"
              onClick={() => setLogsPage((current) => Math.max(1, current - 1))}
              disabled={logsPage === 1}
            >
              Prev
            </button>
            <span>
              Page {logsPage} / {logsTotalPages}
            </span>
            <button
              type="button"
              onClick={() => setLogsPage((current) => Math.min(logsTotalPages, current + 1))}
              disabled={logsPage >= logsTotalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
