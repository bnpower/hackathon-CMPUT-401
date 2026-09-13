"""WSGI config for hire_power_backend."""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hire_power_backend.settings")

application = get_wsgi_application()
