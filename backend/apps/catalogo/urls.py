from rest_framework.routers import DefaultRouter

from .views import PrendaViewSet, VarianteProductoViewSet

router = DefaultRouter()
router.register("prendas", PrendaViewSet, basename="prenda")
router.register("variantes", VarianteProductoViewSet, basename="variante")

urlpatterns = router.urls
