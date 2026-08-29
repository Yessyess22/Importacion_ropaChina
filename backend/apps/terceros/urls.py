from rest_framework.routers import DefaultRouter

from .views import (
    AgenteAduanalViewSet,
    ClienteMayoristaViewSet,
    ProveedorViewSet,
    TransportistaViewSet,
)

router = DefaultRouter()
router.register("proveedores", ProveedorViewSet, basename="proveedor")
router.register("clientes", ClienteMayoristaViewSet, basename="cliente-mayorista")
router.register("agentes-aduanales", AgenteAduanalViewSet, basename="agente-aduanal")
router.register("transportistas", TransportistaViewSet, basename="transportista")

urlpatterns = router.urls
