import { useState, type FormEvent } from "react";

interface AddTaskFormProps {
  onSubmit: (title: string, description: string) => Promise<void>;
}

export const AddTaskForm = ({ onSubmit }: AddTaskFormProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(trimmed, description.trim());
      setTitle("");
      setDescription("");
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
        <button type="submit" disabled={isSubmitting || !title.trim()}>
          {isSubmitting ? "Adding…" : "Add task"}
        </button>
      </div>
    </form>
  );
};
