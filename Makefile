.PHONY: init up down api-contract check check-source
init:
	python3 scripts/init_env.py
up:
	docker compose up --build
down:
	docker compose down
api-contract:
	uv run --project apps/api python scripts/export_openapi.py
	pnpm generate:api
check-source: export pnpm_config_verify_deps_before_run = false
check-source: export UV_FROZEN = true
check-source:
	python3 scripts/test_release_source.py
	uv run --project apps/api ruff check apps/api/src apps/api/tests packages/python/forudid_analysis scripts/release_source.py scripts/test_release_source.py
	uv run --project apps/api pyright --project apps/api
	uv run --project apps/api pytest packages/python/forudid_analysis/tests apps/api/tests/test_cli.py apps/api/tests/test_ingestion_recovery.py apps/api/tests/test_sources.py::test_download_integrity_and_conflict apps/api/tests/test_osm.py::test_osm_preserves_tags_and_rejects_incomplete_geometry -q
	pnpm lint
	pnpm typecheck
	pnpm test
	pnpm build
check:
	uv run --project apps/api ruff check apps/api/src apps/api/tests packages/python/forudid_analysis
	uv run --project apps/api pyright --project apps/api
	uv run --project apps/api pytest apps/api/tests packages/python/forudid_analysis/tests -q
	pnpm lint
	pnpm typecheck
	pnpm test
	pnpm build
