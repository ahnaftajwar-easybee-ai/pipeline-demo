import { useEffect, useState } from "react";
import {
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
  updateTaskStatus,
} from "./api/tasks";
import { AddTaskForm } from "./components/AddTaskForm";
import { FilterBar, type PriorityFilter } from "./components/FilterBar";
import { KanbanBoard } from "./components/KanbanBoard";
import type { Task, TaskPriority, TaskStatus } from "./types";
import "./App.css";

export const App = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const visibleTasks =
    priorityFilter === "all"
      ? tasks
      : tasks.filter((task) => task.priority === priorityFilter);

  useEffect(() => {
    let cancelled = false;

    fetchTasks()
      .then((data) => {
        if (!cancelled) {
          setTasks(data);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load tasks",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleAdd = async (
    title: string,
    description: string,
    priority: TaskPriority,
    dueDate: string | null,
  ) => {
    setError(null);
    try {
      const created = await createTask({
        title,
        description: description || undefined,
        priority,
        ...(dueDate ? { due_date: dueDate } : {}),
      });
      setTasks((prev) => [...prev, created]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    }
  };

  const handleDueDateChange = async (id: number, dueDate: string | null) => {
    setError(null);
    try {
      const updated = await updateTask(id, { due_date: dueDate });
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    }
  };

  const handlePriorityChange = async (id: number, priority: TaskPriority) => {
    setError(null);
    try {
      const updated = await updateTask(id, { priority });
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    }
  };

  const handleStatusChange = async (id: number, status: TaskStatus) => {
    setError(null);
    try {
      const updated = await updateTaskStatus(id, status);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task");
    }
  };

  const handleDelete = async (id: number) => {
    setError(null);
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__inner">
          <h1>Team Task Board</h1>
          <p className="app-header__tagline">
            Plan, track, and ship work across your team
          </p>
        </div>
      </header>
      <main className="app-main">
        <AddTaskForm onSubmit={handleAdd} />
        {error ? (
          <p className="app-error" role="alert">
            {error}
          </p>
        ) : null}
        {isLoading ? (
          <p className="app-loading">Loading tasks…</p>
        ) : (
          <>
            <FilterBar value={priorityFilter} onChange={setPriorityFilter} />
            <KanbanBoard
              tasks={visibleTasks}
              onStatusChange={handleStatusChange}
              onPriorityChange={handlePriorityChange}
              onDueDateChange={handleDueDateChange}
              onDelete={handleDelete}
            />
          </>
        )}
      </main>
    </div>
  );
};
