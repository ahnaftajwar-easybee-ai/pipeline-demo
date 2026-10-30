from datetime import datetime, timezone

from app.models import Task, TaskCreate, TaskStatus, TaskUpdate


def _iso_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


SAMPLE_TASKS: list[dict[str, object]] = [
    {
        "title": "Draft Q4 roadmap",
        "description": "Outline milestones and dependencies for the next quarter.",
        "status": "todo",
    },
    {
        "title": "Review design mockups",
        "description": "Leave feedback on the new dashboard wireframes in Figma.",
        "status": "todo",
    },
    {
        "title": "Update API documentation",
        "description": None,
        "status": "todo",
    },
    {
        "title": "Implement auth middleware",
        "description": "JWT validation and role checks for protected routes.",
        "status": "in_progress",
    },
    {
        "title": "Fix pagination bug",
        "description": "List endpoint skips page 2 when sort order is descending.",
        "status": "in_progress",
    },
    {
        "title": "Set up staging environment",
        "description": "Mirror production config with anonymized data.",
        "status": "in_progress",
    },
    {
        "title": "Ship v1.2 release",
        "description": "Tagged and deployed to production last Tuesday.",
        "status": "done",
    },
    {
        "title": "Onboard new teammate",
        "description": "Access, repo tour, and pairing session completed.",
        "status": "done",
    },
]


class InMemoryTaskRepository:
    def __init__(self) -> None:
        self._tasks: dict[int, Task] = {}
        self._next_id = 1
        self._seed()

    def _seed(self) -> None:
        base = datetime(2026, 10, 28, 14, 0, 0, tzinfo=timezone.utc)
        for index, raw in enumerate(SAMPLE_TASKS):
            task_id = self._next_id
            self._next_id += 1
            created = base.replace(hour=14 + index % 8)
            self._tasks[task_id] = Task(
                id=task_id,
                title=str(raw["title"]),
                description=raw["description"],  # type: ignore[arg-type]
                status=raw["status"],  # type: ignore[arg-type]
                created_at=created.isoformat(),
            )

    def list_tasks(self) -> list[Task]:
        return sorted(self._tasks.values(), key=lambda t: t.id)

    def get_task(self, task_id: int) -> Task | None:
        return self._tasks.get(task_id)

    def create_task(self, payload: TaskCreate) -> Task:
        task_id = self._next_id
        self._next_id += 1
        task = Task(
            id=task_id,
            title=payload.title,
            description=payload.description,
            status=payload.status,
            created_at=_iso_now(),
        )
        self._tasks[task_id] = task
        return task

    def update_task(self, task_id: int, payload: TaskUpdate) -> Task | None:
        existing = self._tasks.get(task_id)
        if existing is None:
            return None
        data = existing.model_dump()
        updates = payload.model_dump(exclude_unset=True)
        data.update(updates)
        updated = Task(**data)
        self._tasks[task_id] = updated
        return updated

    def delete_task(self, task_id: int) -> bool:
        if task_id not in self._tasks:
            return False
        del self._tasks[task_id]
        return True
