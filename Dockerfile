# Copyright (c) Soundscape Community Contributors.
# To run:
#   docker build . -t authoring-tool
#   # Required in production: DJANGO_SECRET_KEY and PSQL_* (PSQL_DB_NAME, PSQL_DB_USER, PSQL_DB_PASS, PSQL_DB_HOST, PSQL_DB_PORT)
#   docker run --env-file ./prod.env -p 8000:8000 -it --rm authoring-tool
#   # or:
#   docker run -e DJANGO_SECRET_KEY=change-me \
#     -e PSQL_DB_NAME=authoring \
#     -e PSQL_DB_USER=authoring \
#     -e PSQL_DB_PASS=change-me \
#     -e PSQL_DB_HOST=postgres \
#     -e PSQL_DB_PORT=5432 \
#     -p 8000:8000 -it --rm authoring-tool

FROM node:22-bookworm-slim AS build-frontend

COPY frontend /app/frontend
WORKDIR /app/frontend
RUN npm ci &&\
 npm exec -- vite build --outDir dist

FROM python:3.12-slim-bookworm AS backend-deps
ENV PYTHONUNBUFFERED=1
WORKDIR /app
COPY backend/pyproject.toml backend/uv.lock backend/README.md ./
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update &&\
    apt-get --no-install-recommends install curl gcc libpq-dev zlib1g-dev libjpeg-dev git -y
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:${PATH}"
RUN uv sync --frozen --no-dev --no-install-project

FROM python:3.12-slim-bookworm AS final
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update &&\
    apt-get --no-install-recommends install libpq5 zlib1g libjpeg62-turbo gosu -y

COPY backend/ /app
COPY --from=backend-deps /app/.venv /app/.venv
COPY docker-entrypoint.sh /
COPY --from=build-frontend /app/frontend/dist /app/frontend/serve
WORKDIR /app
ENV PYTHONPATH=/app
ENV VIRTUAL_ENV=/app/.venv
ENV PATH="${VIRTUAL_ENV}/bin:${PATH}"
ENV DJANGO_SETTINGS_MODULE=backend.settings.production

ENTRYPOINT [ "/docker-entrypoint.sh" ]
CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:8000"]
