import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AddTaskForm } from "./components/AddTaskForm";
import { KanbanBoard } from "./components/KanbanBoard";
import type { Task } from "./types";

const sampleTasks: Task[] = [
  {
    id: 1,
    title: "Alpha task",
    description: "First",
    status: "todo",
    priority: "low",
    created_at: "2026-10-28T14:00:00+00:00",
  },
  {
    id: 2,
    title: "Beta task",
    description: null,
    status: "in_progress",
    priority: "medium",
    created_at: "2026-10-28T15:00:00+00:00",
  },
  {
    id: 3,
    title: "Gamma task",
    description: "Done work",
    status: "done",
    priority: "high",
    created_at: "2026-10-28T16:00:00+00:00",
  },
];

describe("KanbanBoard", () => {
  it("renders three column headings", () => {
    render(
      <KanbanBoard tasks={[]} onStatusChange={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByRole("heading", { name: "To Do" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "In Progress" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Done" })).toBeInTheDocument();
  });

  it("renders tasks in the correct columns", () => {
    render(
      <KanbanBoard
        tasks={sampleTasks}
        onStatusChange={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("Alpha task")).toBeInTheDocument();
    expect(screen.getByText("Beta task")).toBeInTheDocument();
    expect(screen.getByText("Gamma task")).toBeInTheDocument();
  });

  it("renders a colored priority badge on every card", () => {
    render(
      <KanbanBoard
        tasks={sampleTasks}
        onStatusChange={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    const low = screen.getByTestId("priority-badge-1");
    const medium = screen.getByTestId("priority-badge-2");
    const high = screen.getByTestId("priority-badge-3");

    expect(low).toHaveTextContent("Low");
    expect(low).toHaveClass("priority-badge", "priority-badge--low");
    expect(medium).toHaveTextContent("Medium");
    expect(medium).toHaveClass("priority-badge", "priority-badge--medium");
    expect(high).toHaveTextContent("High");
    expect(high).toHaveClass("priority-badge", "priority-badge--high");
  });
});

describe("AddTaskForm", () => {
  it("calls onSubmit with title and description when submitted", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<AddTaskForm onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText("Task title"), "New item");
    await user.type(
      screen.getByPlaceholderText("Description (optional)"),
      "Some details",
    );
    await user.click(screen.getByRole("button", { name: "Add task" }));

    expect(onSubmit).toHaveBeenCalledWith("New item", "Some details");
  });
});
