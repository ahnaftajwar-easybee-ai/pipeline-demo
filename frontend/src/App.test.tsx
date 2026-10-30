import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
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
      <KanbanBoard
        tasks={[]}
        onStatusChange={vi.fn()}
        onPriorityChange={vi.fn()}
        onDelete={vi.fn()}
      />,
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
        onPriorityChange={vi.fn()}
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
        onPriorityChange={vi.fn()}
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

  it("calls onPriorityChange when Low is chosen", async () => {
    const user = userEvent.setup();
    const onPriorityChange = vi.fn();
    render(
      <KanbanBoard
        tasks={[sampleTasks[2]]}
        onStatusChange={vi.fn()}
        onPriorityChange={onPriorityChange}
        onDelete={vi.fn()}
      />,
    );

    await user.selectOptions(
      screen.getByLabelText("Priority for Gamma task"),
      "low",
    );

    expect(onPriorityChange).toHaveBeenCalledWith(3, "low");
  });
});

describe("App", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows a Low badge after a priority patch resolves", async () => {
    const user = userEvent.setup();
    const task: Task = {
      ...sampleTasks[0],
      priority: "high",
    };

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";
        if (url.endsWith("/api/tasks") && method === "GET") {
          return Promise.resolve(
            new Response(JSON.stringify([task]), { status: 200 }),
          );
        }
        if (url.endsWith("/api/tasks/1") && method === "PATCH") {
          const body = JSON.parse(String(init?.body)) as {
            priority: Task["priority"];
          };
          return Promise.resolve(
            new Response(JSON.stringify({ ...task, ...body }), { status: 200 }),
          );
        }
        return Promise.resolve(new Response("not found", { status: 404 }));
      }),
    );

    render(<App />);

    expect(await screen.findByTestId("priority-badge-1")).toHaveTextContent(
      "High",
    );

    await user.selectOptions(
      screen.getByLabelText("Priority for Alpha task"),
      "low",
    );

    await waitFor(() => {
      expect(screen.getByTestId("priority-badge-1")).toHaveTextContent("Low");
    });
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
