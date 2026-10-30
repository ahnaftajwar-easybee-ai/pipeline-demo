import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { AddTaskForm } from "./components/AddTaskForm";
import { KanbanBoard } from "./components/KanbanBoard";
import type { Task, TaskPriority, TaskStatus } from "./types";

const sampleTasks: Task[] = [
  {
    id: 1,
    title: "Alpha task",
    description: "First",
    status: "todo",
    priority: "low",
    due_date: null,
    created_at: "2026-10-28T14:00:00+00:00",
  },
  {
    id: 2,
    title: "Beta task",
    description: null,
    status: "in_progress",
    priority: "medium",
    due_date: null,
    created_at: "2026-10-28T15:00:00+00:00",
  },
  {
    id: 3,
    title: "Gamma task",
    description: "Done work",
    status: "done",
    priority: "high",
    due_date: null,
    created_at: "2026-10-28T16:00:00+00:00",
  },
];

const COLUMN_LABEL: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

const mixedPriorityTasks: Task[] = (
  ["todo", "in_progress", "done"] as const
).flatMap((status, columnIndex) =>
  (["high", "medium", "low"] as const).map((priority, priorityIndex) => ({
    id: columnIndex * 3 + priorityIndex + 1,
    title: `${status} ${priority}`,
    description: null,
    status,
    priority,
    due_date: null,
    created_at: "2026-10-28T14:00:00+00:00",
  })),
);

function stubTaskList(tasks: Task[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      if (String(input).endsWith("/api/tasks") && method === "GET") {
        return Promise.resolve(
          new Response(JSON.stringify(tasks), { status: 200 }),
        );
      }
      return Promise.resolve(new Response("not found", { status: 404 }));
    }),
  );
}

function expectColumnShowsOnly(status: TaskStatus, priority: TaskPriority) {
  const region = screen.getByRole("region", { name: COLUMN_LABEL[status] });
  expect(within(region).getByText(`${status} ${priority}`)).toBeInTheDocument();
  for (const other of ["high", "medium", "low"] as const) {
    if (other === priority) {
      continue;
    }
    expect(
      within(region).queryByText(`${status} ${other}`),
    ).not.toBeInTheDocument();
  }
}

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

  it("shows a High badge after creating a task with high priority", async () => {
    const user = userEvent.setup();
    const created: Task = {
      id: 9,
      title: "New item",
      description: "Some details",
      status: "todo",
      priority: "high",
      due_date: null,
      created_at: "2026-10-28T17:00:00+00:00",
    };

    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      if (url.endsWith("/api/tasks") && method === "GET") {
        return Promise.resolve(
          new Response(JSON.stringify([]), { status: 200 }),
        );
      }
      if (url.endsWith("/api/tasks") && method === "POST") {
        const body = JSON.parse(String(init?.body)) as Partial<Task>;
        return Promise.resolve(
          new Response(JSON.stringify({ ...created, ...body }), {
            status: 201,
          }),
        );
      }
      return Promise.resolve(new Response("not found", { status: 404 }));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);
    await screen.findByRole("heading", { name: "To Do" });

    await user.type(screen.getByPlaceholderText("Task title"), "New item");
    await user.type(
      screen.getByPlaceholderText("Description (optional)"),
      "Some details",
    );
    await user.selectOptions(screen.getByLabelText("Priority"), "high");
    await user.click(screen.getByRole("button", { name: "Add task" }));

    await waitFor(() => {
      expect(screen.getByTestId("priority-badge-9")).toHaveTextContent("High");
    });

    const postCall = fetchMock.mock.calls.find(
      (call) =>
        String(call[0]).endsWith("/api/tasks") && call[1]?.method === "POST",
    );
    expect(JSON.parse(String(postCall?.[1]?.body))).toMatchObject({
      title: "New item",
      description: "Some details",
      priority: "high",
    });
    expect(JSON.parse(String(postCall?.[1]?.body))).not.toHaveProperty(
      "due_date",
    );
  });

  it("posts due_date when the add form includes a date", async () => {
    const user = userEvent.setup();
    const created: Task = {
      id: 9,
      title: "Dated item",
      description: "",
      status: "todo",
      priority: "medium",
      due_date: "2026-11-03",
      created_at: "2026-10-28T17:00:00+00:00",
    };

    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      if (url.endsWith("/api/tasks") && method === "GET") {
        return Promise.resolve(
          new Response(JSON.stringify([]), { status: 200 }),
        );
      }
      if (url.endsWith("/api/tasks") && method === "POST") {
        const body = JSON.parse(String(init?.body)) as Partial<Task>;
        return Promise.resolve(
          new Response(JSON.stringify({ ...created, ...body }), {
            status: 201,
          }),
        );
      }
      return Promise.resolve(new Response("not found", { status: 404 }));
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);
    await screen.findByRole("heading", { name: "To Do" });

    await user.type(screen.getByPlaceholderText("Task title"), "Dated item");
    await user.type(screen.getByLabelText("Due date"), "2026-11-03");
    await user.click(screen.getByRole("button", { name: "Add task" }));

    await waitFor(() => {
      expect(screen.getByText("Dated item")).toBeInTheDocument();
    });

    const postCall = fetchMock.mock.calls.find(
      (call) =>
        String(call[0]).endsWith("/api/tasks") && call[1]?.method === "POST",
    );
    expect(JSON.parse(String(postCall?.[1]?.body))).toMatchObject({
      title: "Dated item",
      priority: "medium",
      due_date: "2026-11-03",
    });
  });

  it("filters every column to High and restores every card with All", async () => {
    const user = userEvent.setup();
    stubTaskList(mixedPriorityTasks);
    render(<App />);
    await screen.findByText("todo high");

    expect(
      screen.getByRole("group", { name: "Filter by priority" }),
    ).toBeInTheDocument();

    const allButton = screen.getByRole("button", { name: "All" });
    expect(allButton).toHaveAttribute("aria-pressed", "true");

    const highButton = screen.getByRole("button", { name: "High" });
    await user.click(highButton);
    expect(highButton).toHaveAttribute("aria-pressed", "true");
    expect(allButton).toHaveAttribute("aria-pressed", "false");

    for (const status of ["todo", "in_progress", "done"] as const) {
      expectColumnShowsOnly(status, "high");
    }

    await user.click(allButton);
    expect(allButton).toHaveAttribute("aria-pressed", "true");
    for (const task of mixedPriorityTasks) {
      expect(screen.getByText(task.title)).toBeInTheDocument();
    }
  });

  it.each([
    ["Medium", "medium"],
    ["Low", "low"],
  ] as const)(
    "filters every column to %s",
    async (label, priority) => {
      const user = userEvent.setup();
      stubTaskList(mixedPriorityTasks);
      render(<App />);
      await screen.findByText("todo high");

      const button = screen.getByRole("button", { name: label });
      await user.click(button);
      expect(button).toHaveAttribute("aria-pressed", "true");

      for (const status of ["todo", "in_progress", "done"] as const) {
        expectColumnShowsOnly(status, priority);
      }
    },
  );
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

    expect(onSubmit).toHaveBeenCalledWith(
      "New item",
      "Some details",
      "medium",
      null,
    );
  });

  it("calls onSubmit with high when High is chosen", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<AddTaskForm onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText("Task title"), "New item");
    await user.type(
      screen.getByPlaceholderText("Description (optional)"),
      "Some details",
    );
    await user.selectOptions(screen.getByLabelText("Priority"), "high");
    await user.click(screen.getByRole("button", { name: "Add task" }));

    expect(onSubmit).toHaveBeenCalledWith(
      "New item",
      "Some details",
      "high",
      null,
    );
  });

  it("calls onSubmit with the chosen due date and then clears the field", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<AddTaskForm onSubmit={onSubmit} />);

    const dueDate = screen.getByLabelText("Due date");
    expect(dueDate).toHaveAttribute("type", "date");

    await user.type(screen.getByPlaceholderText("Task title"), "New item");
    await user.type(dueDate, "2026-11-03");
    await user.click(screen.getByRole("button", { name: "Add task" }));

    expect(onSubmit).toHaveBeenCalledWith(
      "New item",
      "",
      "medium",
      "2026-11-03",
    );
    expect(dueDate).toHaveValue("");
  });
});
