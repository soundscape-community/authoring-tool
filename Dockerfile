# To run:
#   docker build . -t authoring-tool
#   docker run -p 8000:8000 -it --rm authoring-tool 

FROM node:22-bookworm-slim as build-frontend

COPY frontend /app/frontend
WORKDIR /app/frontend
RUN npm ci &&\
 npm exec -- vite build --outDir dist

FROM python:3.12-slim-bookworm as backend-deps
ENV PYTHONUNBUFFERED=1
COPY backend/requirements.txt /app/requirements.txt
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update &&\
    apt-get --no-install-recommends install gcc libpq-dev zlib1g-dev libjpeg-dev -y
RUN python -m venv /venv &&\
    /venv/bin/pip install --upgrade pip &&\
    /venv/bin/pip install wheel setuptools gunicorn -r /app/requirements.txt

FROM python:3.12-slim-bookworm as final
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update &&\
    apt-get --no-install-recommends install libpq5 zlib1g libjpeg62-turbo gosu -y

COPY --from=backend-deps /venv /venv
COPY backend/ /app
COPY docker-entrypoint.sh /
COPY --from=build-frontend /app/frontend/dist /app/frontend/serve
WORKDIR /app
ENV PYTHONPATH=/app
ENV DJANGO_SETTINGS_MODULE=backend.settings.local

ENTRYPOINT [ "/docker-entrypoint.sh" ]
CMD ["/venv/bin/gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:8000"]
