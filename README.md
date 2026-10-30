# Team Task Board

A small full-stack demo app: a three-column kanban **Team Task Board** with a FastAPI backend and a React frontend. It ships with seeded sample tasks and in-memory storage so you can run it locally with no database setup—ideal for live demos where new features land in the pipeline and the UI updates in real time.

## Prerequisites

- **Python 3.12**
- **Node.js 20+** and npm

## Quick start

### Install dependencies

```bash
make install
```

This runs `pip install -r backend/requirements.txt` and `npm --prefix frontend install`.

### Run locally (backend + frontend)

```bash
make dev
```

- **API:** http://localhost:8000 (try `GET /api/health` and `GET /api/tasks`)
- **UI:** http://localhost:5173 (Vite proxies `/api` to the backend)

Press `Ctrl+C` in the terminal to stop. If the backend keeps running in the background, stop it with `pkill -f "uvicorn app.main:app"` or close the shell.

### Run tests

```bash
make test
```

Runs backend **pytest** and frontend **Vitest** suites.

### Manual commands

**Backend only:**

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend only:**

```bash
cd frontend
npm run dev
```

**Frontend checks (also run in CI):**

```bash
cd frontend
npm run lint
npm run typecheck
npm run test
npm run build
```

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/tasks` | List all tasks |
| POST | `/api/tasks` | Create a task (`title`, optional `description`, optional `status`) |
| PATCH | `/api/tasks/{id}` | Update `title`, `description`, and/or `status` |
| DELETE | `/api/tasks/{id}` | Remove a task |

Task `status` values: `todo`, `in_progress`, `done`.

## Project layout

```
backend/          FastAPI app, in-memory task repository, pytest tests
frontend/         React + Vite + TypeScript kanban UI
Makefile          install, dev, test shortcuts
.github/workflows/ci.yml
```
