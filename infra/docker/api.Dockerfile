FROM node:22.22.3-slim AS report-dependencies
WORKDIR /renderer
RUN npm install --ignore-scripts --no-audit --no-fund --save-exact @playwright/test@1.62.1

FROM python:3.13.7-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends libexpat1 \
    && rm -rf /var/lib/apt/lists/*
COPY --from=ghcr.io/astral-sh/uv:0.12.10 /uv /usr/local/bin/uv
WORKDIR /app/apps/api

FROM base AS report-runtime
RUN apt-get update && apt-get install -y --no-install-recommends chromium \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --uid 10001 --create-home renderer

FROM base AS api
COPY apps/api/pyproject.toml apps/api/uv.lock ./
COPY packages/python/forudid_analysis /app/packages/python/forudid_analysis
RUN uv sync --frozen --no-dev --no-install-project
COPY apps/api/ ./
COPY scripts/render_report.mjs /app/scripts/render_report.mjs
COPY apps/web/public/fonts/xb-zar /app/apps/web/public/fonts/xb-zar
RUN uv sync --frozen --no-dev
ENV PATH="/app/apps/api/.venv/bin:$PATH"
CMD ["uvicorn", "forudid_api.main:app", "--host", "0.0.0.0", "--port", "8000"]

FROM report-runtime AS report-worker
COPY --from=api /app /app
COPY --from=report-dependencies /usr/local/bin/node /usr/local/bin/node
COPY --from=report-dependencies /renderer/node_modules /app/apps/web/node_modules
COPY --from=report-dependencies /renderer/package.json /app/apps/web/package.json
ENV REPORT_CHROME_BINARY=/usr/bin/chromium PATH="/app/apps/api/.venv/bin:$PATH"
USER renderer
CMD ["python", "-m", "forudid_api.report_worker", "--watch"]
