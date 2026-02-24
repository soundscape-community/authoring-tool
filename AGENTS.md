<!-- Copyright (c) Soundscape Community Contributors. -->
# Soundscape Authoring Tool - Agent Instructions

## Architecture Overview

This is a Django + React web application for creating routed activities (GPS-based tours) for the Soundscape iOS app. The system converts between internal data models and GPX format for export/import.

### Key Components
- **Backend**: Django REST API with SQLite (local) / PostgreSQL (development/production)
- **Frontend**: React SPA built with Vite, served by Django in production
- **Core Domain**: Activities contain WaypointGroups (ordered/unordered/geofence) which contain Waypoints with optional media

## Development Workflow

### Environment Setup
- Backend uses `uv` for Python project management in `backend/` directory
- Do not create or manage a separate Python virtual environment manually; `uv` handles environment creation and usage.
- **Important**: ALL backend commands (uv AND Django) run from `backend/` directory only
- **Required**: Run backend Python/Django commands via `uv run ...` (do not call `.venv/bin/python` directly)
- **Critical**: Each terminal command starts fresh - always set working directory AND environment variables inline
- Settings are environment-specific: `backend/backend/settings/{local,development,production}.py`
- For local development: Set `DJANGO_SETTINGS_MODULE=backend.settings.local`
- Environment variables in `backend/.env/` files (create from sample.env and install.md)

### Dependency Management
- Use `uv add <package>` to add new Python dependencies (from `backend/` directory)
- Avoid using `pip` directly - let `uv` manage the virtual environment and dependencies
- **Ignore `requirements.txt`** - project uses `pyproject.toml` and `uv.lock` for dependency management
- Frontend dependencies managed with `npm` in `frontend/` directory

### Agent Clarifications
- When clarification is needed and the tool is available, use `ask_questions` instead of ad-hoc free-text questions so prompts are explicit and choices are structured.

### Frontend Build Process
- Frontend builds to `backend/frontend/serve/` via Vite config
- Development: `npm run start` (port 3000) proxies API calls to Django (port 8000) - no build needed
- Production: `npm run build` then Django serves static files via WhiteNoise

### Critical Startup Sequence
**For Development:**
1. Install backend deps: `cd $(git rev-parse --show-toplevel)/backend && uv sync`
2. Run migrations: `cd $(git rev-parse --show-toplevel)/backend && DJANGO_SETTINGS_MODULE=backend.settings.local uv run python -Wd manage.py migrate`
3. Create superuser: `cd $(git rev-parse --show-toplevel)/backend && DJANGO_SETTINGS_MODULE=backend.settings.local uv run python -Wd manage.py createsuperuser`
4. Start Django: `cd $(git rev-parse --show-toplevel)/backend && DJANGO_SETTINGS_MODULE=backend.settings.local uv run python -Wd manage.py runserver`
5. Start frontend: `cd $(git rev-parse --show-toplevel)/frontend && npm run start` (in separate terminal)

## Project-Specific Patterns

### Model Architecture
- All models inherit from `CommonModel` (UUID primary key, created/updated timestamps)
- Activity model uses signals for automatic `unpublished_changes` tracking
- File storage uses computed paths: `activities/{activity_id}/{file_type}`
- Geographic coordinates use 6 decimal places precision (`geographic_decimal_places = 6`)

### API Design
- ViewSets filter by authenticated user's `author_id` automatically
- Custom actions like `@action(detail=True, methods=['post'])` for export/publish/duplicate
- GPX import/export handled in `api/gpx_utils.py` with custom XML namespaces

### Frontend State Management
- Main component is a class-based React component with complex state management
- Activities list vs. selected activity detail pattern
- Modal management for CRUD operations
- Leaflet maps with custom overlays for waypoint visualization

### File Handling
- Images stored with computed paths via `activityImageStorageName()` function
- GPX files generated on-demand, not persisted (except for published activities)
- Media cleanup handled via Django model signals (`post_delete`)

## Key Integration Points

### Authentication Flow
- Uses `dj-rest-auth` for session-based authentication
- `UserAllowlistMiddleware` controls access (currently commented out for development)
- User context parsed in `UserParseMiddleware`

### GPX Processing
- `activity_to_gpx()` converts internal models to GPX with custom Soundscape extensions
- `gpx_to_activity()` parses uploaded GPX files, creating Activity + Waypoints
- Uses `lxml` if available, falls back to stdlib XML parsers

### Settings Environment Variables
```python
# Required in production
DJANGO_SECRET_KEY, ALLOWED_HOSTS, CSRF_TRUSTED_ORIGINS
PSQL_DB_NAME, PSQL_DB_USER, PSQL_DB_PASS, PSQL_DB_HOST, PSQL_DB_PORT
```

## Testing & Debugging

### Running Tests
- Backend: `cd $(git rev-parse --show-toplevel)/backend && DJANGO_SETTINGS_MODULE=backend.settings.local uv run python -Wd manage.py test`
- Frontend: `cd $(git rev-parse --show-toplevel)/frontend && npm test -- --run`
- **Required after changes**: Always run the most relevant test(s) for the files/behavior you modified before finishing.

### Common Debug Points
- Check `backend/db.sqlite3` exists after migrations
- CORS issues: Frontend dev server proxies to backend via Vite config
- File uploads: Check `MEDIA_ROOT` and `MEDIA_URL` settings

## Deployment Notes

### Docker Composition
- Uses PostgreSQL container for production
- Volume mounts for persistent file storage
- Environment variables from `.env` file

### Azure/Production Considerations
- Commented Azure Storage integration in `production.py`
- WhiteNoise serves static files
- WEBSITE_HOSTNAME auto-added to ALLOWED_HOSTS

## Copyright Notices

- Use the upstream reference at `microsoft/soundscape` under `svcs/soundscape-authoring` when comparing file origins.
- Files identical to the upstream Microsoft project keep only the Microsoft copyright notice.
- Files derived from Microsoft code that diverged from upstream must include both the Microsoft notice and the Soundscape Community Contributors notice.
- Files not present in the upstream project must include only the Soundscape Community Contributors notice (do not add a Microsoft notice).
- If a file format cannot accept comments (for example JSON, lockfiles, or binaries), add an explicit metadata field or document the exception in the change summary.

When modifying this codebase, pay special attention to the Activity lifecycle (creation → editing → publishing), the GPX import/export functionality, and the React state management patterns that coordinate between the activity list and detail views.

## Folder Planning

The implementation plan for activity folders (including permissions, nesting, migration strategy, and UI expectations) lives in `PLAN.md`. Keep that plan up-to-date as work progresses, and after each implementation phase run tests, commit changes, and refresh the plan’s next steps.
