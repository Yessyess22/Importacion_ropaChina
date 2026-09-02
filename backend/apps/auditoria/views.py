from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.usuarios.permissions import HasRole, Roles

from .models import Bitacora
from .serializers import BitacoraSerializer


class BitacoraViewSet(viewsets.ReadOnlyModelViewSet):
    """GET /api/v1/bitacora/ (S4-T03): consulta paginada de la bitácora
    de auditoría, filtrable por `usuario` (exacto) y con búsqueda de
    texto sobre `accion` vía `?search=`. Es de solo lectura por diseño:
    la única vía de escritura es `auditoria_services.registrar()`,
    invocada desde los servicios de dominio (nunca desde esta vista)."""

    queryset = Bitacora.objects.select_related("usuario", "entidad_content_type").all()
    serializer_class = BitacoraSerializer
    permission_classes = [IsAuthenticated, HasRole(Roles.ADMINISTRADOR)]
    filterset_fields = ["usuario"]
    search_fields = ["accion"]
