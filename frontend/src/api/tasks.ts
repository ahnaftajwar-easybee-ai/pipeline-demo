import type { Task, TaskCreatePayload, TaskStatus } from "../types";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || response.statusText);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export async function fetchTasks(): Promise<Task[]> {
  const response = await fetch("/api/tasks");
  return handleResponse<Task[]>(response);
}

export async function createTask(payload: TaskCreatePayload): Promise<Task> {
  const response = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<Task>(response);
}

export async function updateTaskStatus(
  id: number,
  status: TaskStatus,
): Promise<Task> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return handleResponse<Task>(response);
}

export async function deleteTask(id: number): Promise<void> {
  const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  await handleResponse<void>(response);
}
