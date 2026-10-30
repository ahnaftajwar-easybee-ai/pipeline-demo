.PHONY: install dev test

install:
	pip install -r backend/requirements.txt
	npm --prefix frontend install

dev:
	@echo "Starting backend on http://localhost:8000 and frontend on http://localhost:5173"
	@(cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000) & \
	 npm --prefix frontend run dev

test:
	cd backend && pytest -v
	cd frontend && npm run test
