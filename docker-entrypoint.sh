#!/usr/bin/env bash
# Copyright (c) Soundscape Community Contributors.
set -e

#create a user and group in the container to access the bind mount from the host
if ! getent group user > /dev/null 2>&1; then
    groupadd -g "${PGID:-1000}" user
fi
if ! getent passwd user > /dev/null 2>&1; then
    useradd -u "${PUID:-1000}" -g user user
fi

#fix ownership of the bind mount
chown -R user:user /app/backend/files
# allow manage.py collectstatic to write to /app/backend/staticfiles
mkdir -p /app/backend/staticfiles
chown -R user:user /app/backend/staticfiles

gosu user env PATH="$PATH" python manage.py collectstatic --noinput
gosu user env PATH="$PATH" python manage.py migrate

# Execute the main command
gosu user env PATH="$PATH" "$@"