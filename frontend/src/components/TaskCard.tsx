import type { Task, TaskPriority, TaskStatus } from "../types";

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const PRIORITY_OPTIONS: TaskPriority[] = ["low", "medium", "high"];

function localTodayISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDueLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const formatted = new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return `Due ${formatted}`;
}

function isOverdue(task: Task): boolean {
  return (
    task.due_date !== null &&
    task.due_date < localTodayISO() &&
    task.status !== "done"
  );
}

interface TaskCardProps {
  task: Task;
  onStatusChange: (id: number, status: TaskStatus) => void;
  onPriorityChange: (id: number, priority: TaskPriority) => void;
  onDueDateChange: (id: number, dueDate: string | null) => void;
  onDelete: (id: number) => void;
}

export const TaskCard = ({
  task,
  onStatusChange,
  onPriorityChange,
  onDueDateChange,
  onDelete,
}: TaskCardProps) => {
  const createdLabel = new Date(task.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const overdue = isOverdue(task);

  return (
    <article
      className={overdue ? "task-card task-card--overdue" : "task-card"}
      data-testid={`task-card-${task.id}`}
    >
      <header className="task-card__header">
        <div className="task-card__heading">
          <h3 className="task-card__title">{task.title}</h3>
          <span
            className={`priority-badge priority-badge--${task.priority}`}
            data-testid={`priority-badge-${task.id}`}
          >
            {PRIORITY_LABEL[task.priority]}
          </span>
        </div>
        <button
          type="button"
          className="task-card__delete"
          aria-label={`Delete ${task.title}`}
          onClick={() => onDelete(task.id)}
        >
          ×
        </button>
      </header>
      {task.description ? (
        <p className="task-card__description">{task.description}</p>
      ) : (
        <p className="task-card__description task-card__description--empty">
          No description
        </p>
      )}
      {task.due_date ? (
        <div className="task-card__schedule">
          <span
            className="task-card__due"
            data-testid={`due-label-${task.id}`}
          >
            {formatDueLabel(task.due_date)}
          </span>
          {overdue ? (
            <span
              className="task-card__overdue"
              data-testid={`overdue-${task.id}`}
            >
              Overdue
            </span>
          ) : null}
        </div>
      ) : null}
      <footer className="task-card__footer">
        <time className="task-card__date" dateTime={task.created_at}>
          {createdLabel}
        </time>
        <div className="task-card__actions">
          <label className="task-card__move">
            <span className="sr-only">Priority</span>
            <select
              value={task.priority}
              aria-label={`Priority for ${task.title}`}
              onChange={(event) =>
                onPriorityChange(task.id, event.target.value as TaskPriority)
              }
            >
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>
                  {PRIORITY_LABEL[priority]}
                </option>
              ))}
            </select>
          </label>
          <label className="task-card__move">
            <span className="sr-only">Due date</span>
            <input
              type="date"
              aria-label={`Due date for ${task.title}`}
              value={task.due_date ?? ""}
              onChange={(event) =>
                onDueDateChange(task.id, event.target.value || null)
              }
            />
          </label>
          <label className="task-card__move">
            <span className="sr-only">Move task</span>
            <select
              value={task.status}
              aria-label={`Move ${task.title}`}
              onChange={(event) =>
                onStatusChange(task.id, event.target.value as TaskStatus)
              }
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </footer>
    </article>
  );
};
