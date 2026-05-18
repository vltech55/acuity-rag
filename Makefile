.PHONY: help up down logs build rebuild migrate ingest eval test lint format psql clean

help:
	@echo "Targets:"
	@echo "  up         start postgres + backend + frontend (docker-compose)"
	@echo "  down       stop and remove containers"
	@echo "  logs       tail logs for all services"
	@echo "  build      build all images"
	@echo "  rebuild    rebuild images without cache"
	@echo "  migrate    apply alembic migrations"
	@echo "  ingest     fetch arXiv corpus + chunk + embed"
	@echo "  eval       run eval harness against current index"
	@echo "  test       run backend pytest suite"
	@echo "  lint       ruff + mypy"
	@echo "  format     ruff format"
	@echo "  psql       open psql shell against running db"
	@echo "  clean      remove containers + volumes (destructive)"

up:
	docker compose up -d
	@echo "Backend:  http://localhost:8000/docs"
	@echo "Frontend: http://localhost:3000"

down:
	docker compose down

logs:
	docker compose logs -f --tail=200

build:
	docker compose build

rebuild:
	docker compose build --no-cache

migrate:
	docker compose exec backend alembic upgrade head

ingest:
	docker compose exec backend python -m scripts.seed_corpus

gen-test-set:
	docker compose exec backend python -m scripts.generate_test_set

eval:
	docker compose exec backend python -m scripts.run_eval

test:
	docker compose exec backend pytest -v

lint:
	docker compose exec backend ruff check src tests scripts
	docker compose exec backend mypy src

format:
	docker compose exec backend ruff format src tests scripts
	docker compose exec backend ruff check --fix src tests scripts

psql:
	docker compose exec postgres psql -U rag -d rag

clean:
	docker compose down -v
