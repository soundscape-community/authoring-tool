#!/bin/bash
# Run by Docker container whenever it is launched

cd /app/backend/

python3 manage.py collectstatic --noinput
python3 manage.py migrate

gunicorn backend.wsgi:application --bind 0.0.0.0:8000
