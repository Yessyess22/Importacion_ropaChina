"""
URLs raíz del proyecto.

En esta fase solo existen rutas de infraestructura (admin y health check).
Las rutas de negocio (catálogo, importaciones, pedidos, etc.) se agregarán
en fases posteriores mediante `include()` por dominio, sin modificar este
archivo más que para registrar el nuevo prefijo.
"""
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health_check(request):
    return JsonResponse({"status": "ok", "service": "trendy-import-backend"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check, name="health-check"),
    path("api/auth/", include("apps.usuarios.urls")),
]
