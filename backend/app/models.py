from typing import Literal

from pydantic import BaseModel, Field, field_validator

TaskStatus = Literal["todo", "in_progress", "done"]
TaskPriority = Literal["low", "medium", "high"]


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: str | None = None
    status: TaskStatus = "todo"
    priority: TaskPriority = "medium"


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1)
    description: str | None = None
    status: TaskStatus | None = None
    priority: TaskPriority | None = None

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


class Task(BaseModel):
    id: int
    title: str
    description: str | None
    status: TaskStatus
    priority: TaskPriority
    created_at: str
