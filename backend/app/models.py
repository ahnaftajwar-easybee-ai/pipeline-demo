from typing import Literal

from pydantic import BaseModel, Field

TaskStatus = Literal["todo", "in_progress", "done"]


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: str | None = None
    status: TaskStatus = "todo"


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1)
    description: str | None = None
    status: TaskStatus | None = None


class Task(BaseModel):
    id: int
    title: str
    description: str | None
    status: TaskStatus
    created_at: str
