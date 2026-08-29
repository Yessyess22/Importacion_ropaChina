from rest_framework.routers import DefaultRouter

from .views import DetalleImportacionViewSet, OperacionImportacionViewSet

router = DefaultRouter()
router.register("importaciones", OperacionImportacionViewSet, basename="importacion")
router.register("detalles-importacion", DetalleImportacionViewSet, basename="detalle-importacion")

urlpatterns = router.urls
