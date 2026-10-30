import pytest
from fastapi.testclient import TestClient

import app.main as main_module
from app.main import app
from app.repository import InMemoryTaskRepository


@pytest.fixture
def client() -> TestClient:
    main_module.repository = InMemoryTaskRepository()
    return TestClient(app)


@pytest.mark.parametrize("path", ["/api/health"])
def test_health_returns_ok(client: TestClient, path: str) -> None:
    response = client.get(path)
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_list_tasks_returns_seeded_tasks(client: TestClient) -> None:
    response = client.get("/api/tasks")
    assert response.status_code == 200
    tasks = response.json()
    assert len(tasks) == 8
    statuses = {t["status"] for t in tasks}
    assert statuses == {"todo", "in_progress", "done"}
    for task in tasks:
        assert "id" in task
        assert task["title"]
        assert "created_at" in task


def test_create_task_returns_201_with_defaults(client: TestClient) -> None:
    response = client.post(
        "/api/tasks",
        json={"title": "New task", "description": "Details here"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "New task"
    assert body["description"] == "Details here"
    assert body["status"] == "todo"
    assert body["id"] == 9


def test_create_task_rejects_empty_title(client: TestClient) -> None:
    response = client.post("/api/tasks", json={"title": ""})
    assert response.status_code == 422


def test_patch_task_updates_fields(client: TestClient) -> None:
    response = client.patch(
        "/api/tasks/1",
        json={"status": "in_progress", "title": "Updated title"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == 1
    assert body["title"] == "Updated title"
    assert body["status"] == "in_progress"


def test_patch_missing_task_returns_404(client: TestClient) -> None:
    response = client.patch("/api/tasks/9999", json={"status": "done"})
    assert response.status_code == 404
    assert response.json()["detail"] == "Task not found"


def test_delete_task_returns_204(client: TestClient) -> None:
    response = client.delete("/api/tasks/1")
    assert response.status_code == 204
    list_response = client.get("/api/tasks")
    ids = [t["id"] for t in list_response.json()]
    assert 1 not in ids


def test_delete_missing_task_returns_404(client: TestClient) -> None:
    response = client.delete("/api/tasks/9999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Task not found"
