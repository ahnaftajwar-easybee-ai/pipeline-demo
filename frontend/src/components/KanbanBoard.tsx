import type { Task, TaskPriority, TaskStatus } from "../types";
import { TaskCard } from "./TaskCard";

const COLUMNS: { status: TaskStatus; title: string; className: string }[] = [
  { status: "todo", title: "To Do", className: "column--todo" },
  { status: "in_progress", title: "In Progress", className: "column--progress" },
  { status: "done", title: "Done", className: "column--done" },
];

interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange: (id: number, status: TaskStatus) => void;
  onPriorityChange: (id: number, priority: TaskPriority) => void;
  onDelete: (id: number) => void;
}

export const KanbanBoard = ({
  tasks,
  onStatusChange,
  onPriorityChange,
  onDelete,
}: KanbanBoardProps) => {
  return (
    <div className="board" data-testid="kanban-board">
      {COLUMNS.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.status);
        return (
          <section
            key={column.status}
            className={`column ${column.className}`}
            aria-label={column.title}
          >
            <header className="column__header">
              <h2>{column.title}</h2>
              <span className="column__count">{columnTasks.length}</span>
            </header>
            <div className="column__cards">
              {columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={onStatusChange}
                  onPriorityChange={onPriorityChange}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};
