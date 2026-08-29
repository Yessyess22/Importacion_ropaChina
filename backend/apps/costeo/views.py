from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.usuarios.permissions import HasRole, Roles

from . import services
from .models import Costeo, TipoCambio, Tributo
from .serializers import CosteoSerializer, TipoCambioSerializer, TributoSerializer

FINANCIERO_ROLES = (Roles.ADMINISTRADOR, Roles.CONTABILIDAD)
LECTURA_FINANCIERA_ROLES = FINANCIERO_ROLES + (Roles.OPERADOR_COMERCIO_EXTERIOR,)


class CosteoViewSet(viewsets.ReadOnlyModelViewSet):
    """Costeo de una operación (RF-04). Solo lectura por API: se
    recalcula con la acción `calcular-costeo` de
    `OperacionImportacionViewSet`, nunca se edita `costo_total` a mano
    (es siempre un valor derivado). El Cliente Mayorista no tiene acceso
    (sección 18: información financiera interna)."""

    queryset = Costeo.objects.select_related("operacion").prefetch_related("tributos")
    serializer_class = CosteoSerializer
    permission_classes = [IsAuthenticated, HasRole(*LECTURA_FINANCIERA_ROLES)]
    filterset_fields = ["operacion"]


class TributoViewSet(viewsets.ModelViewSet):
    """Tributos de un costeo (RF-05). El Cliente Mayorista no tiene
    acceso."""

    queryset = Tributo.objects.select_related("costeo__operacion")
    serializer_class = TributoSerializer
    permission_classes = [IsAuthenticated, HasRole(*LECTURA_FINANCIERA_ROLES)]
    filterset_fields = ["costeo", "tipo"]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAuthenticated(), HasRole(*FINANCIERO_ROLES)()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.instance = services.crear_tributo(serializer.validated_data)

    def perform_update(self, serializer):
        serializer.instance = services.actualizar_tributo(serializer.instance, serializer.validated_data)


class TipoCambioViewSet(viewsets.ModelViewSet):
    """Tipo de cambio diario USD/BOB (RF-10). La unicidad por fecha ya la
    garantiza el modelo (`fecha` es `unique=True`); DRF la valida
    automáticamente y devuelve 400 ante un duplicado."""

    queryset = TipoCambio.objects.all()
    serializer_class = TipoCambioSerializer
    permission_classes = [IsAuthenticated, HasRole(*LECTURA_FINANCIERA_ROLES)]
    filterset_fields = ["fecha"]
    ordering_fields = ["fecha"]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAuthenticated(), HasRole(*FINANCIERO_ROLES)()]
        return super().get_permissions()
