.PHONY: init up down api-contract check
init:
	python3 scripts/init_env.py
up:
	docker compose up --build
down:
	docker compose down
api-contract:
	uv run --project apps/api python scripts/export_openapi.py
	pnpm generate:api
check:
	uv run --project apps/api ruff check apps/api/src apps/api/tests packages/python/forudid_analysis
	uv run --project apps/api pyright --project apps/api
	uv run --project apps/api pytest apps/api/tests packages/python/forudid_analysis/tests -q
	pnpm lint
	pnpm typecheck
	pnpm test
	pnpm build
