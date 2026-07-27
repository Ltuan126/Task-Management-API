import { useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { useTasks } from "./hooks/useTasks";
import { useAnalytics } from "./hooks/useAnalytics";
import { useAdmin } from "./hooks/useAdmin";
import { AuthPage } from "./components/AuthPage";
import { AdminPanel } from "./components/AdminPanel";
import { TopBar } from "./components/TopBar";
import { HeroPanel } from "./components/HeroPanel";
import { CreateTaskForm } from "./components/CreateTaskForm";
import { TaskFilters } from "./components/TaskFilters";
import { TaskList } from "./components/TaskList";
import { AnalyticsPanel } from "./components/AnalyticsPanel";

function App() {
  const auth = useAuth();
  const tasks = useTasks(auth.token, auth.handleLogout);
  const analytics = useAnalytics(auth.token || "");

  // Server-side RBAC is the real gate; this only decides whether to render the
  // console and issue its requests.
  const isAdmin = auth.user?.role === "admin";
  const admin = useAdmin(auth.token, isAdmin, {
    getAccessToken: auth.getAccessToken,
    getRefreshToken: auth.getRefreshToken,
    onTokensRefreshed: auth.onTokensRefreshed,
    onRefreshFailed: auth.handleLogout,
  });

  // Auto-refresh analytics when tasks stats change
  useEffect(() => {
    if (auth.token) {
      analytics.refreshAnalytics();
    }
  }, [tasks.stats, auth.token]);

  if (!auth.token || !auth.user) {
    return <AuthPage {...auth} onSubmit={auth.handleAuthSubmit} />;
  }

  return (
    <main className="dashboard-shell">
      <HeroPanel totalTasks={tasks.totalTasks} stats={tasks.stats} />

      <TopBar user={auth.user} onLogout={auth.handleLogout} />

      <CreateTaskForm
        newTitle={tasks.newTitle}
        setNewTitle={tasks.setNewTitle}
        newDescription={tasks.newDescription}
        setNewDescription={tasks.setNewDescription}
        newPriority={tasks.newPriority}
        setNewPriority={tasks.setNewPriority}
        newDueDate={tasks.newDueDate}
        setNewDueDate={tasks.setNewDueDate}
        newTags={tasks.newTags}
        setNewTags={tasks.setNewTags}
        onSubmit={tasks.handleCreateTask}
      />

      <TaskFilters
        search={tasks.search}
        setSearch={tasks.setSearch}
        statusFilter={tasks.statusFilter}
        setStatusFilter={tasks.setStatusFilter}
        priorityFilter={tasks.priorityFilter}
        setPriorityFilter={tasks.setPriorityFilter}
        sortBy={tasks.sortBy}
        setSortBy={tasks.setSortBy}
        sortOrder={tasks.sortOrder}
        setSortOrder={tasks.setSortOrder}
        dueDateFrom={tasks.dueDateFrom}
        setDueDateFrom={tasks.setDueDateFrom}
        dueDateTo={tasks.dueDateTo}
        setDueDateTo={tasks.setDueDateTo}
      />

      <TaskList
        tasks={tasks.tasks}
        totalTasks={tasks.totalTasks}
        loadingTasks={tasks.loadingTasks}
        errorMessage={tasks.errorMessage}
        successMessage={tasks.successMessage}
        page={tasks.page}
        totalPages={tasks.totalPages}
        setPage={tasks.setPage}
        onStatusChange={tasks.handleStatusChange}
        onUpdate={tasks.handleUpdateTask}
        onDelete={tasks.handleDeleteTask}
      />

      <AnalyticsPanel
        data={analytics.analytics}
        loading={analytics.loading}
        onRefresh={analytics.refreshAnalytics}
      />

      {isAdmin && (
        <AdminPanel
          currentUserId={auth.user.id}
          users={admin.users}
          usersTotal={admin.usersTotal}
          usersPage={admin.usersPage}
          usersTotalPages={admin.usersTotalPages}
          setUsersPage={admin.setUsersPage}
          loadingUsers={admin.loadingUsers}
          savingUserId={admin.savingUserId}
          adminCount={admin.adminCount}
          onRoleChange={admin.handleRoleChange}
          logs={admin.logs}
          logsTotal={admin.logsTotal}
          logsPage={admin.logsPage}
          logsTotalPages={admin.logsTotalPages}
          setLogsPage={admin.setLogsPage}
          loadingLogs={admin.loadingLogs}
          actionFilter={admin.actionFilter}
          setActionFilter={admin.setActionFilter}
          emailFilter={admin.emailFilter}
          setEmailFilter={admin.setEmailFilter}
          errorMessage={admin.errorMessage}
          successMessage={admin.successMessage}
        />
      )}
    </main>
  );
}

export default App;
