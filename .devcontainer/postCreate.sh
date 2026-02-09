#!/usr/bin/env bash
# Copyright (c) Soundscape Community Contributers.
set -euo pipefail

# install uv locally for managing backend dependencies
curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"

# install the backend dependencies with uv and run migrations
(
	cd backend
	uv sync
	DJANGO_SETTINGS_MODULE=backend.settings.local uv run python -Wd manage.py migrate
)

# install the frontend dependencies
(
	cd frontend
	npm ci
)
