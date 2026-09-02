"""
Configuración de pytest-django para el backend.
Ejecutar desde el directorio backend/: pytest apps/auditoria/
"""


def pytest_configure(config):
    import os

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
