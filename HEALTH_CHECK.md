# Health Check Setup

This project uses `django-health-check` to monitor the health of the application and its dependencies.

## Installation

The package is already installed via `uv`. If you need to reinstall:

```bash
cd backend
uv add django-health-check
```

## Configuration

The health check has been configured in `backend/backend/settings/base.py` with the following apps:

- `health_check` - Core health check functionality
- `health_check.db` - Database connectivity check

The health check endpoint is available at `/ht/` (configured in `backend/backend/urls.py`).

## Usage

### Command Line

You can run health checks via the Django management command:

```bash
cd backend
DJANGO_SETTINGS_MODULE=backend.settings.local uv run python -Wd manage.py health_check
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

**Using query parameter:**
```bash
curl http://localhost:8000/ht/?format=json
```

### Expected JSON Response

When all checks pass (HTTP 200):
```json
{
    "DatabaseBackend": "working"
}
```

When checks fail (HTTP 500):
```json
{
    "DatabaseBackend": "unavailable: <error message>"
}
```

## What is Checked

Currently configured checks:

1. **Database Connection** - Verifies that the Django database is accessible and can execute queries

## Use Cases

### Local Development
Use the management command to quickly verify database connectivity:
```bash
cd backend
DJANGO_SETTINGS_MODULE=backend.settings.local uv run python manage.py health_check
```

### Production Monitoring
- Configure uptime monitoring tools (Pingdom, StatusCake, etc.) to monitor `https://yourdomain.com/ht/`
- The endpoint returns HTTP 200 when healthy, HTTP 500 when unhealthy
- Use the JSON format for programmatic monitoring

### Container Orchestration
For Docker/Kubernetes health checks, add to your deployment configuration:

**Docker Compose:**
```yaml
services:
  web:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/ht/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

**Kubernetes:**
```yaml
livenessProbe:
  httpGet:
    path: /ht/
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10
readinessProbe:
  httpGet:
    path: /ht/
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Additional Health Checks

You can extend the health checks by adding more apps to `INSTALLED_APPS` in `base.py`:

```python
INSTALLED_APPS = [
    # ... existing apps ...
    'health_check',
    'health_check.db',                          # Stock Django health checkers
    'health_check.cache',                       # Cache backend check
    'health_check.storage',                     # Storage backend check
    'health_check.contrib.migrations',          # Check for unapplied migrations
    # 'health_check.contrib.celery',            # Requires celery
    # 'health_check.contrib.redis',             # Requires Redis
    # 'health_check.contrib.psutil',            # Disk and memory utilization
]
```

After adding new health check apps, run migrations:
```bash
cd backend
DJANGO_SETTINGS_MODULE=backend.settings.local uv run python manage.py migrate
```

## Documentation

For more information, see the official documentation:
- PyPI: https://pypi.org/project/django-health-check/
- GitHub: https://github.com/revsys/django-health-check
