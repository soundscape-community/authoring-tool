# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.
# Copyright (c) Soundscape Community Contributors.

import os
from .base import *

# Allow running locally without DJANGO_SECRET_KEY pre-set in the environment.
# base.py requires DJANGO_SECRET_KEY; local.py overrides with a dev-only key.
SECRET_KEY = os.getenv(
    'DJANGO_SECRET_KEY',
    'django-insecure-local-dev-key-do-not-use-in-production',
)

DEBUG = True

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Used for serving local user-uploaded files
# I.g., "http://127.0.0.1:8000/files/{file_path}"
MEDIA_URL = 'files/'

# Used for storing local user-uploaded files
MEDIA_ROOT = os.path.join(BASE_DIR, MEDIA_URL)

ALLOWED_HOSTS = [
    '*'
]

# allow Github Code Spaces to pass CSRF origin check
CSRF_TRUSTED_ORIGINS = [
    'https://*.app.github.dev',
    'http://localhost:3000',
    'http://*.localhost:3000',
]

