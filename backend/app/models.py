from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, field_validator

TaskStatus = Literal["todo", "in_progress", "done"]
TaskPriority = Literal["low", "medium", "high"]


def _canonical_due_date(value: str | None) -> str | None:
    """Accept null, or a real calendar date whose text is exactly YYYY-MM-DD."""
    if value is None:
        return None
    try:
        parsed = date.fromisoformat(value)
    except ValueError as exc:
        raise ValueError(
            "due_date must be a real calendar date in YYYY-MM-DD form"
        ) from exc
    if parsed.isoformat() != value:
        raise ValueError("due_date must be a canonical YYYY-MM-DD date")
    return value


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: str | None = None
    status: TaskStatus = "todo"
    priority: TaskPriority = "medium"
    due_date: str | None = None

    @field_validator("due_date")
    @classmethod
    def due_date_must_be_canonical_iso(cls, value: str | None) -> str | None:
        return _canonical_due_date(value)


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1)
    description: str | None = None
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    due_date: str | None = None

    @field_validator("priority")
    @classmethod
    def reject_explicit_null_priority(
        cls, value: TaskPriority | None
    ) -> TaskPriority | None:
        # Omitted priority is left unset. An explicit null is rejected so the
        # merge cannot store a missing priority and return 500.
        if value is None:
            raise ValueError("priority cannot be null")
        return value

    @field_validator("due_date")
    @classmethod
    def due_date_must_be_canonical_iso(cls, value: str | None) -> str | None:
        # Unlike priority, an explicit null is valid and clears the date.
        return _canonical_due_date(value)


class Task(BaseModel):
    id: int
    title: str
    description: str | None
    status: TaskStatus
    priority: TaskPriority
    due_date: str | None = None
    created_at: str

    @field_validator("due_date")
    @classmethod
    def due_date_must_be_canonical_iso(cls, value: str | None) -> str | None:
        return _canonical_due_date(value)
