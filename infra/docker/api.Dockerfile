FROM python:3.13.7-slim
COPY --from=ghcr.io/astral-sh/uv:0.12.10 /uv /usr/local/bin/uv
WORKDIR /app/apps/api
COPY apps/api/pyproject.toml apps/api/uv.lock ./
COPY packages/python/forudid_analysis /app/packages/python/forudid_analysis
RUN uv sync --frozen --no-dev --no-install-project
COPY apps/api/ ./
COPY scripts/render_report.mjs /app/scripts/render_report.mjs
COPY apps/web/public/fonts/xb-zar /app/apps/web/public/fonts/xb-zar
RUN uv sync --frozen --no-dev
ENV PATH="/app/apps/api/.venv/bin:$PATH"
CMD ["uvicorn", "forudid_api.main:app", "--host", "0.0.0.0", "--port", "8000"]
