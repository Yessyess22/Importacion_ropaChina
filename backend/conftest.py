"""
Configuración de pytest-django para el backend.
Ejecutar desde el directorio backend/: pytest apps/auditoria/
"""
import django
from django.conf import settings


def pytest_configure(config):
    import os
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
