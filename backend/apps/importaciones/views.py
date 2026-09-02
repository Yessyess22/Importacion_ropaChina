from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.costeo import services as costeo_services
from apps.costeo.serializers import CosteoSerializer
from apps.usuarios.permissions import HasRole, Roles
from config.exceptions import ConflictError

from . import services
from .models import DetalleImportacion, OperacionImportacion
from .serializers import (
    CambiarEstadoOperacionSerializer,
    DetalleImportacionSerializer,
    OperacionImportacionSerializer,
)

GESTION_ROLES = (Roles.ADMINISTRADOR, Roles.OPERADOR_COMERCIO_EXTERIOR)
LECTURA_ROLES = (
    Roles.ADMINISTRADOR,
    Roles.OPERADOR_COMERCIO_EXTERIOR,
    Roles.AGENTE_ADUANAL,
    Roles.CONTABILIDAD,
)
ESTADO_ROLES = (Roles.ADMINISTRADOR, Roles.OPERADOR_COMERCIO_EXTERIOR, Roles.AGENTE_ADUANAL)
COSTEO_ROLES = (Roles.ADMINISTRADOR, Roles.CONTABILIDAD)


class OperacionImportacionViewSet(viewsets.ModelViewSet):
    """Operaciones de importación (RF-03). El Cliente Mayorista no tiene
    acceso: es información interna de la cadena de importación. No se
    permite DELETE (sección 54: no destruir historial de importaciones);
    una operación se cancela cambiando su estado a CANCELADA."""

    queryset = OperacionImportacion.objects.select_related(
        "proveedor", "agente_aduanal", "transportista"
    ).prefetch_related("detalles__variante")
    serializer_class = OperacionImportacionSerializer
    permission_classes = [IsAuthenticated, HasRole(*LECTURA_ROLES)]
    filterset_fields = ["estado", "proveedor"]
    search_fields = ["codigo_unico"]
    ordering_fields = ["fecha_registro", "valor_cif"]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update"):
            return [IsAuthenticated(), HasRole(*GESTION_ROLES)()]
        if self.action == "actualizar_estado":
            return [IsAuthenticated(), HasRole(*ESTADO_ROLES)()]
        if self.action == "calcular_costeo":
            return [IsAuthenticated(), HasRole(*COSTEO_ROLES)()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.instance = services.crear_operacion(serializer.validated_data, self.request.user)

    def perform_update(self, serializer):
        serializer.instance = services.actualizar_operacion(serializer.instance, serializer.validated_data)

    @action(detail=True, methods=["post"], url_path="actualizar-estado")
    def actualizar_estado(self, request, pk=None):
        """POST /api/v1/importaciones/{id}/actualizar-estado/ (RF-07). No
        es un PATCH de `estado` porque el cambio dispara reglas de
        negocio (entrada de stock al liberar, ver `services.cambiar_estado`).
        """
        operacion = self.get_object()
        serializer = CambiarEstadoOperacionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        operacion = services.cambiar_estado(operacion, serializer.validated_data["estado"], request.user)
        return Response(OperacionImportacionSerializer(operacion).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="calcular-costeo")
    def calcular_costeo(self, request, pk=None):
        """POST /api/v1/importaciones/{id}/calcular-costeo/ (RF-04/RF-05).
        Recalcula el costo total de nacionalización (CIF + tributos ya
        registrados); no expone un CRUD de `Costeo` editable a mano."""

        operacion = self.get_object()
        costeo = costeo_services.calcular_costeo(operacion)
        return Response(CosteoSerializer(costeo).data, status=status.HTTP_200_OK)


class DetalleImportacionViewSet(viewsets.ModelViewSet):
    """Líneas de una operación de importación. Se listan/filtran por
    `?operacion=<id>` en vez de anidarlas bajo una ruta
    `/importaciones/{id}/detalles/`, para no agregar un router de rutas
    anidadas por una única relación (sección 9: no complejizar sin
    necesidad clara)."""

    queryset = DetalleImportacion.objects.select_related("operacion", "variante")
    serializer_class = DetalleImportacionSerializer
    permission_classes = [IsAuthenticated, HasRole(*LECTURA_ROLES)]
    filterset_fields = ["operacion", "variante"]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAuthenticated(), HasRole(*GESTION_ROLES)()]
        return super().get_permissions()

    def perform_destroy(self, instance):
        if instance.operacion.estado in (
            OperacionImportacion.Estado.LIBERADA,
            OperacionImportacion.Estado.CANCELADA,
        ):
            raise ConflictError("No se puede eliminar un detalle de una operación liberada o cancelada.")
        instance.delete()
