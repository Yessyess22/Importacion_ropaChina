from rest_framework.routers import DefaultRouter

from .views import MovimientoInventarioViewSet

router = DefaultRouter()
router.register("movimientos-inventario", MovimientoInventarioViewSet, basename="movimiento-inventario")

urlpatterns = router.urls
