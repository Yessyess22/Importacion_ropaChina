"""
Configuración específica para producción.

Se deja preparada para fases futuras. No se activa en Fase 1: el proyecto
se ejecuta con config.settings.development por defecto (ver manage.py y
docker-compose.yml).
"""
from .base import *  # noqa: F401,F403
from .base import env

DEBUG = False

ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=[])

SECURE_SSL_REDIRECT = env.bool("DJANGO_SECURE_SSL_REDIRECT", default=True)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
