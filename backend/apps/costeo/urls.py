from rest_framework.routers import DefaultRouter

from .views import CosteoViewSet, TipoCambioViewSet, TributoViewSet

router = DefaultRouter()
router.register("costeos", CosteoViewSet, basename="costeo")
router.register("tributos", TributoViewSet, basename="tributo")
router.register("tipo-cambio", TipoCambioViewSet, basename="tipo-cambio")

urlpatterns = router.urls
