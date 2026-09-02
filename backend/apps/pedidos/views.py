from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.usuarios.permissions import HasRole, Roles

from . import services
from .models import DetallePedido, PedidoMayorista
from .permissions import IsOwnerPedidoOrStaff
from .serializers import (
    ActualizarDetallesPedidoSerializer,
    CambiarEstadoPedidoSerializer,
    DetallePedidoSerializer,
    PedidoMayoristaCreateSerializer,
    PedidoMayoristaSerializer,
)

GESTION_ROLES = (Roles.ADMINISTRADOR, Roles.OPERADOR_COMERCIO_EXTERIOR)
LECTURA_ROLES = GESTION_ROLES + (Roles.CONTABILIDAD, Roles.CLIENTE_MAYORISTA)


class PedidoMayoristaViewSet(viewsets.ModelViewSet):
    """Pedidos mayoristas (RF-15). Un Cliente Mayorista solo ve y crea
    pedidos propios (secciones 24/37); Administrador/Operador ven y
    gestionan todos; Contabilidad solo lectura; Agente Aduanal sin acceso
    (no participa del proceso comercial). No se permite editar ni
    eliminar un pedido existente (sección 54): los cambios de estado
    pasan por la acción `actualizar-estado`."""

    permission_classes = [IsAuthenticated, HasRole(*LECTURA_ROLES), IsOwnerPedidoOrStaff]
    filterset_fields = ["estado", "cliente"]
    search_fields = ["codigo_pedido"]
    ordering_fields = ["fecha"]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        queryset = PedidoMayorista.objects.select_related("cliente").prefetch_related(
            "detalles__variante__prenda"
        )
        user = self.request.user
        if getattr(user, "rol_id", None) and user.rol.nombre == Roles.CLIENTE_MAYORISTA:
            cliente = getattr(user, "cliente_mayorista", None)
            return queryset.filter(cliente=cliente) if cliente else queryset.none()
        return queryset

    def get_serializer_class(self):
        if self.action == "create":
            return PedidoMayoristaCreateSerializer
        return PedidoMayoristaSerializer

    def get_permissions(self):
        if self.action in ("actualizar_estado", "actualizar_detalles"):
            return [IsAuthenticated(), HasRole(*GESTION_ROLES)()]
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user
        cliente = serializer.validated_data.get("cliente")
        if getattr(user, "rol_id", None) and user.rol.nombre == Roles.CLIENTE_MAYORISTA:
            # Nunca se confía en un `cliente` del payload para este rol:
            # siempre se resuelve desde la sesión (sección 37).
            cliente = getattr(user, "cliente_mayorista", None)
            if cliente is None:
                return Response(
                    {"detail": "Este usuario no tiene un cliente mayorista asociado."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        elif cliente is None:
            return Response(
                {"detail": "Debe indicar el cliente mayorista del pedido."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        pedido = services.crear_pedido(cliente, serializer.validated_data["detalles"], user)
        return Response(PedidoMayoristaSerializer(pedido).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="actualizar-estado")
    def actualizar_estado(self, request, pk=None):
        pedido = self.get_object()
        serializer = CambiarEstadoPedidoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        pedido = services.cambiar_estado_pedido(pedido, serializer.validated_data["estado"], request.user)
        return Response(PedidoMayoristaSerializer(pedido).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="actualizar-detalles")
    def actualizar_detalles(self, request, pk=None):
        pedido = self.get_object()
        serializer = ActualizarDetallesPedidoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        pedido = services.actualizar_detalles_pedido(
            pedido, serializer.validated_data["detalles"], request.user
        )
        return Response(PedidoMayoristaSerializer(pedido).data, status=status.HTTP_200_OK)


class DetallePedidoViewSet(viewsets.ReadOnlyModelViewSet):
    """Solo lectura (sección 25): un detalle de pedido nunca se edita
    suelto, se crea junto con el pedido vía `services.crear_pedido`."""

    serializer_class = DetallePedidoSerializer
    permission_classes = [IsAuthenticated, HasRole(*LECTURA_ROLES), IsOwnerPedidoOrStaff]
    filterset_fields = ["pedido", "variante"]

    def get_queryset(self):
        queryset = DetallePedido.objects.select_related("pedido__cliente", "variante")
        user = self.request.user
        if getattr(user, "rol_id", None) and user.rol.nombre == Roles.CLIENTE_MAYORISTA:
            cliente = getattr(user, "cliente_mayorista", None)
            return queryset.filter(pedido__cliente=cliente) if cliente else queryset.none()
        return queryset
