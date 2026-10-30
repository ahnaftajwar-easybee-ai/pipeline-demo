import { useState, type FormEvent } from "react";
import type { TaskPriority } from "../types";

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

interface AddTaskFormProps {
  onSubmit: (
    title: string,
    description: string,
    priority: TaskPriority,
  ) => Promise<void>;
}

export const AddTaskForm = ({ onSubmit }: AddTaskFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(trimmed, description.trim(), priority);
      setTitle("");
      setDescription("");
      setPriority("medium");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="add-task" onSubmit={handleSubmit} aria-label="Add task">
      <h2 className="add-task__heading">Add a task</h2>
      <div className="add-task__fields">
        <input
          type="text"
          name="title"
          placeholder="Task title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
        />
        <input
          type="text"
          name="description"
          placeholder="Description (optional)"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <select
          aria-label="Priority"
          value={priority}
          onChange={(event) =>
            setPriority(event.target.value as TaskPriority)
          }
        >
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button type="submit" disabled={isSubmitting || !title.trim()}>
          {isSubmitting ? "Adding…" : "Add task"}
        </button>
      </div>
    </form>
  );
};
