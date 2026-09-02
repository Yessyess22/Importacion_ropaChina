"""
URLs raíz del proyecto.

Las rutas de negocio versionadas viven bajo /api/v1/ (ver
`config/urls_v1.py`, que agrega el router de cada app de dominio). Este
archivo solo agrega infraestructura: admin, health check, autenticación
(Fase 3, sin cambios) y documentación OpenAPI.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


def health_check(request):
    return JsonResponse({"status": "ok", "service": "trendy-import-backend"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check, name="health-check"),
    path("api/auth/", include("apps.usuarios.urls")),
    path("api/v1/", include("config.urls_v1")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="api-docs",
    ),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
