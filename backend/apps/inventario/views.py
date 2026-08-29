from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.catalogo.serializers import VarianteProductoSerializer
from apps.usuarios.permissions import HasRole, Roles

from . import services
from .models import MovimientoInventario
from .serializers import (
    AjustarStockSerializer,
    MovimientoInventarioSerializer,
    RegistrarMovimientoSerializer,
)

GESTION_ROLES = (Roles.ADMINISTRADOR, Roles.OPERADOR_COMERCIO_EXTERIOR)
LECTURA_ROLES = GESTION_ROLES + (Roles.CONTABILIDAD, Roles.AGENTE_ADUANAL)


class MovimientoInventarioViewSet(viewsets.ReadOnlyModelViewSet):
    """Ledger de movimientos de stock (RF-09). Es de solo lectura por
    diseño (sección 22 del encargo): las escrituras pasan por las
    acciones `entrada`/`salida`/`ajuste`, nunca por un POST/PATCH directo
    al ledger, para garantizar que todo movimiento actualice también
    `VarianteProducto.stock_disponible` de forma atómica y sin negativos.
    """

    queryset = MovimientoInventario.objects.select_related("variante__prenda")
    serializer_class = MovimientoInventarioSerializer
    permission_classes = [IsAuthenticated, HasRole(*LECTURA_ROLES)]
    filterset_fields = ["variante", "tipo"]
    ordering_fields = ["fecha"]

    def get_permissions(self):
        if self.action in ("entrada", "salida"):
            return [IsAuthenticated(), HasRole(*GESTION_ROLES)()]
        if self.action == "ajuste":
            return [IsAuthenticated(), HasRole(Roles.ADMINISTRADOR)()]
        return super().get_permissions()

    @action(detail=False, methods=["post"])
    def entrada(self, request):
        serializer = RegistrarMovimientoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        variante = services.registrar_entrada(**serializer.validated_data)
        return Response(VarianteProductoSerializer(variante).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"])
    def salida(self, request):
        serializer = RegistrarMovimientoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        variante = services.registrar_salida(**serializer.validated_data)
        return Response(VarianteProductoSerializer(variante).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"])
    def ajuste(self, request):
        serializer = AjustarStockSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        variante = services.registrar_ajuste(**serializer.validated_data)
        return Response(VarianteProductoSerializer(variante).data, status=status.HTTP_201_CREATED)
