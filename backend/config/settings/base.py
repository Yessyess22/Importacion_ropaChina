"""
Configuración base de Django, común a todos los entornos.

Los valores sensibles o dependientes del entorno (claves, hosts, credenciales
de base de datos) NUNCA se escriben aquí de forma literal: se leen desde
variables de entorno mediante django-environ.
"""
from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env()
environ.Env.read_env(BASE_DIR.parent / ".env")

SECRET_KEY = env("DJANGO_SECRET_KEY", default="unsafe-secret-key-for-dev-only")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Terceros
    "rest_framework",
    "corsheaders",
    # Apps propias del dominio
    "apps.usuarios",
    "apps.terceros",
    "apps.catalogo",
    "apps.importaciones",
    "apps.documentos",
    "apps.costeo",
    "apps.inventario",
    "apps.pedidos",
    "apps.reportes",
    "apps.auditoria",
]

AUTH_USER_MODEL = "usuarios.Usuario"

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": env("DATABASE_NAME", default="trendy_import"),
        "USER": env("DATABASE_USER", default="postgres"),
        "PASSWORD": env("DATABASE_PASSWORD", default="postgres"),
        "HOST": env("DATABASE_HOST", default="postgres"),
        "PORT": env("DATABASE_PORT", default="5432"),
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "es"
TIME_ZONE = "America/La_Paz"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR.parent / "staticfiles"

MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR.parent / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "apps.usuarios.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}

CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=[])
# Necesario porque la autenticación es por cookie de sesión: el navegador
# solo la envía/acepta en peticiones cross-origin si el servidor lo permite
# explícitamente. La lista de orígenes sigue restringida por
# CORS_ALLOWED_ORIGINS (nunca se usa CORS_ALLOW_ALL_ORIGINS).
CORS_ALLOW_CREDENTIALS = True
