<!-- Copyright (c) Soundscape Community Contributors. -->
# Health Check Setup

This project uses `django-health-check` to monitor the health of the application and its dependencies.

The health check endpoint is available at `/ht/` (configured in `backend/backend/urls.py`).

## Usage

### Command Line

You can run health checks via the Django management command:

```bash
cd backend
uv run python manage.py health_check
```

Expected output:
```
DatabaseBackend          ... working
DatabaseBackend[default] ... working
```

### HTTP Endpoint

Once the Django server is running, you can access the health check endpoint:

**HTML Format (Browser):**
```bash
curl http://localhost:8000/ht/
```

**JSON Format (API/Monitoring):**
```bash
curl -H "Accept: application/json" http://localhost:8000/ht/
```
