export type TaskStatus = "todo" | "in_progress" | "done";

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  created_at: string;
}

export interface TaskCreatePayload {
  title: string;
  description?: string;
  status?: TaskStatus;
}
