"""ASGI config for hire_power_backend."""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hire_power_backend.settings")

application = get_asgi_application()
