#!/usr/bin/env bash
# Copyright (c) Soundscape Community Contributors.
set -e

#create a user and group in the container to access the bind mount from the host
groupadd -g ${PGID} user
useradd -u ${PUID} -g user user

#fix ownership of the bind mount
chown -R user:user /app/backend/files
# allow manage.py collectstatic to write to /app/backend/staticfiles
mkdir -p /app/backend/staticfiles
chown -R user:user /app/backend/staticfiles

gosu user env PATH="$PATH" python manage.py collectstatic --noinput
gosu user env PATH="$PATH" python manage.py migrate

# Execute the main command
gosu user env PATH="$PATH" "$@"