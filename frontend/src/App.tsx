import { useEffect, useState } from "react";
import {
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
  updateTaskStatus,
} from "./api/tasks";
import { AddTaskForm } from "./components/AddTaskForm";
import { KanbanBoard } from "./components/KanbanBoard";
import type { Task, TaskPriority, TaskStatus } from "./types";
import "./App.css";

export const App = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
  ) => {
    setError(null);
    try {
      const created = await createTask({
        title,
        description: description || undefined,
        priority,
      });
      setTasks((prev) => [...prev, created]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
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
          <KanbanBoard
            tasks={tasks}
            onStatusChange={handleStatusChange}
            onPriorityChange={handlePriorityChange}
            onDelete={handleDelete}
          />
        )}
      </main>
    </div>
  );
};
