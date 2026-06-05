import { useAuth } from "./hooks/useAuth";
import { useTasks } from "./hooks/useTasks";
import { AuthPage } from "./components/AuthPage";
import { TopBar } from "./components/TopBar";
import { HeroPanel } from "./components/HeroPanel";
import { CreateTaskForm } from "./components/CreateTaskForm";
import { TaskFilters } from "./components/TaskFilters";
import { TaskList } from "./components/TaskList";

function App() {
  const auth = useAuth();
  const tasks = useTasks(auth.token, auth.handleLogout);

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
    </main>
  );
}

export default App;
