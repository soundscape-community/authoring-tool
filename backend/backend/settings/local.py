# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

import os
from .base import *

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
    'localhost'
]

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "WARNING",
    },
    "loggers": {
        "django.server": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        },
    },
}