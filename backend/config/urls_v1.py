"""Rutas de negocio de la API, versionadas bajo /api/v1/.

Cada app de dominio define su propio `urls.py` con su router; este
archivo solo las agrega bajo el prefijo de versión, para poder introducir
`/api/v2/` en el futuro (Fase 5+) sin tocar las apps ni romper clientes
que sigan consumiendo v1 (sección 7 del encargo).
"""
from django.urls import include, path

urlpatterns = [
    path("", include("apps.terceros.urls")),
    path("", include("apps.catalogo.urls")),
    path("", include("apps.importaciones.urls")),
    path("", include("apps.documentos.urls")),
    path("", include("apps.costeo.urls")),
    path("", include("apps.inventario.urls")),
    path("", include("apps.pedidos.urls")),
    path("", include("apps.reportes.urls")),
]
