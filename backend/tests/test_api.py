from datetime import date

import pytest
from fastapi.testclient import TestClient

import app.main as main_module
from app.main import app
from app.repository import InMemoryTaskRepository

_NON_CANONICAL_DUE_DATES = ("2026-11-3", "11/03/2026", "not-a-date")


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


def test_create_task_defaults_priority_to_medium(client: TestClient) -> None:
    response = client.post("/api/tasks", json={"title": "No priority given"})
    assert response.status_code == 201
    assert response.json()["priority"] == "medium"


def test_create_task_with_high_priority_is_listed_as_high(
    client: TestClient,
) -> None:
    response = client.post(
        "/api/tasks",
        json={"title": "Hot item", "priority": "high"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["priority"] == "high"
    listed = client.get("/api/tasks").json()
    created = next(task for task in listed if task["id"] == body["id"])
    assert created["priority"] == "high"


def test_create_task_rejects_invalid_priority(client: TestClient) -> None:
    before = client.get("/api/tasks").json()
    response = client.post(
        "/api/tasks",
        json={"title": "Not a priority", "priority": "urgent"},
    )
    assert response.status_code == 422
    after = client.get("/api/tasks").json()
    assert len(after) == len(before)


def test_patch_rejects_invalid_and_null_priority(client: TestClient) -> None:
    before = next(task for task in client.get("/api/tasks").json() if task["id"] == 1)
    invalid = client.patch("/api/tasks/1", json={"priority": "urgent"})
    assert invalid.status_code == 422
    explicit_null = client.patch("/api/tasks/1", json={"priority": None})
    assert explicit_null.status_code == 422
    after = next(task for task in client.get("/api/tasks").json() if task["id"] == 1)
    assert after["priority"] == before["priority"]


def test_patch_priority_to_low_persists(client: TestClient) -> None:
    response = client.patch("/api/tasks/1", json={"priority": "low"})
    assert response.status_code == 200
    assert response.json()["priority"] == "low"
    listed = client.get("/api/tasks").json()
    task = next(item for item in listed if item["id"] == 1)
    assert task["priority"] == "low"


def test_patch_explicit_null_description_clears_description(
    client: TestClient,
) -> None:
    before = next(task for task in client.get("/api/tasks").json() if task["id"] == 1)
    assert before["description"] is not None
    response = client.patch("/api/tasks/1", json={"description": None})
    assert response.status_code == 200
    assert response.json()["description"] is None
    after = next(task for task in client.get("/api/tasks").json() if task["id"] == 1)
    assert after["description"] is None


def test_seeded_tasks_include_all_priorities(client: TestClient) -> None:
    tasks = client.get("/api/tasks").json()
    assert len(tasks) == 8
    priorities = {task["priority"] for task in tasks}
    assert {"low", "medium", "high"} <= priorities
    assert all(task["priority"] in {"low", "medium", "high"} for task in tasks)


def test_create_task_without_due_date_returns_null(client: TestClient) -> None:
    response = client.post("/api/tasks", json={"title": "No date"})
    assert response.status_code == 201
    assert response.json()["due_date"] is None


def test_create_and_patch_store_canonical_due_date(client: TestClient) -> None:
    created = client.post(
        "/api/tasks",
        json={"title": "Dated task", "due_date": "2026-11-03"},
    )
    assert created.status_code == 201
    body = created.json()
    assert body["due_date"] == "2026-11-03"

    patched = client.patch(
        f"/api/tasks/{body['id']}",
        json={"due_date": "2026-12-01"},
    )
    assert patched.status_code == 200
    assert patched.json()["due_date"] == "2026-12-01"

    listed = client.get("/api/tasks").json()
    stored = next(task for task in listed if task["id"] == body["id"])
    assert stored["due_date"] == "2026-12-01"


def test_patch_null_due_date_clears_it(client: TestClient) -> None:
    created = client.post(
        "/api/tasks",
        json={"title": "Clear me", "due_date": "2026-11-03"},
    ).json()
    response = client.patch(f"/api/tasks/{created['id']}", json={"due_date": None})
    assert response.status_code == 200
    assert response.json()["due_date"] is None
    listed = client.get("/api/tasks").json()
    stored = next(task for task in listed if task["id"] == created["id"])
    assert stored["due_date"] is None


def test_patch_omitted_due_date_leaves_it_unchanged(client: TestClient) -> None:
    created = client.post(
        "/api/tasks",
        json={"title": "Keep date", "due_date": "2026-11-03"},
    ).json()
    response = client.patch(
        f"/api/tasks/{created['id']}",
        json={"title": "Renamed"},
    )
    assert response.status_code == 200
    assert response.json()["due_date"] == "2026-11-03"
    assert response.json()["title"] == "Renamed"


@pytest.mark.parametrize("bad_due_date", _NON_CANONICAL_DUE_DATES)
def test_create_rejects_non_canonical_due_date(
    client: TestClient, bad_due_date: str
) -> None:
    before = client.get("/api/tasks").json()
    response = client.post(
        "/api/tasks",
        json={"title": "Bad date", "due_date": bad_due_date},
    )
    assert response.status_code == 422
    after = client.get("/api/tasks").json()
    assert after == before


@pytest.mark.parametrize("bad_due_date", _NON_CANONICAL_DUE_DATES)
def test_patch_rejects_non_canonical_due_date_without_mutate(
    client: TestClient, bad_due_date: str
) -> None:
    created = client.post(
        "/api/tasks",
        json={"title": "Stay dated", "due_date": "2026-11-03"},
    ).json()
    before = next(
        task for task in client.get("/api/tasks").json() if task["id"] == created["id"]
    )
    response = client.patch(
        f"/api/tasks/{created['id']}",
        json={"due_date": bad_due_date},
    )
    assert response.status_code == 422
    after = next(
        task for task in client.get("/api/tasks").json() if task["id"] == created["id"]
    )
    assert after == before


def test_seed_has_overdue_due_soon_and_undated_tasks(client: TestClient) -> None:
    today = date.today().isoformat()
    tasks = client.get("/api/tasks").json()
    assert len(tasks) == 8
    overdue = [
        task
        for task in tasks
        if task["due_date"] is not None
        and task["due_date"] < today
        and task["status"] != "done"
    ]
    due_soon = [
        task
        for task in tasks
        if task["due_date"] is not None and task["due_date"] > today
    ]
    undated = [task for task in tasks if task["due_date"] is None]
    assert overdue
    assert due_soon
    assert undated
    assert all(task["priority"] in {"low", "medium", "high"} for task in tasks)
