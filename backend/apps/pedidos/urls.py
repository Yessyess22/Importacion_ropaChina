from rest_framework.routers import DefaultRouter

from .views import DetallePedidoViewSet, PedidoMayoristaViewSet

router = DefaultRouter()
router.register("pedidos", PedidoMayoristaViewSet, basename="pedido")
router.register("detalles-pedido", DetallePedidoViewSet, basename="detalle-pedido")

urlpatterns = router.urls
