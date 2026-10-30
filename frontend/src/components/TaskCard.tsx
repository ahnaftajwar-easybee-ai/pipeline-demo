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

interface TaskCardProps {
  task: Task;
  onStatusChange: (id: number, status: TaskStatus) => void;
  onDelete: (id: number) => void;
}

export const TaskCard = ({
  task,
  onStatusChange,
  onDelete,
}: TaskCardProps) => {
  const createdLabel = new Date(task.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <article className="task-card" data-testid={`task-card-${task.id}`}>
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
      <footer className="task-card__footer">
        <time className="task-card__date" dateTime={task.created_at}>
          {createdLabel}
        </time>
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
      </footer>
    </article>
  );
};
