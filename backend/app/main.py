from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.models import Task, TaskCreate, TaskUpdate
from app.repository import InMemoryTaskRepository

app = FastAPI(title="Team Task Board API")
repository = InMemoryTaskRepository()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/tasks", response_model=list[Task])
async def list_tasks() -> list[Task]:
    return repository.list_tasks()


@app.post("/api/tasks", response_model=Task, status_code=201)
async def create_task(payload: TaskCreate) -> Task:
    return repository.create_task(payload)


@app.patch("/api/tasks/{task_id}", response_model=Task)
async def update_task(task_id: int, payload: TaskUpdate) -> Task:
    updated = repository.update_task(task_id, payload)
    if updated is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return updated


@app.delete("/api/tasks/{task_id}", status_code=204)
async def delete_task(task_id: int) -> None:
    if not repository.delete_task(task_id):
        raise HTTPException(status_code=404, detail="Task not found")
