from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.usuarios.permissions import HasRole, Roles

from .models import AgenteAduanal, ClienteMayorista, Proveedor, Transportista
from .permissions import IsOwnerClienteOrStaffReadOnly
from .serializers import (
    AgenteAduanalSerializer,
    ClienteMayoristaSerializer,
    ProveedorSerializer,
    TransportistaSerializer,
)

# Los cuatro roles internos de la operación (todo menos Cliente Mayorista).
STAFF_ROLES = (
    Roles.ADMINISTRADOR,
    Roles.OPERADOR_COMERCIO_EXTERIOR,
    Roles.AGENTE_ADUANAL,
    Roles.CONTABILIDAD,
)


class ProveedorViewSet(viewsets.ModelViewSet):
    """CRUD de proveedores/fábricas (RF-02). El Cliente Mayorista no tiene
    acceso: un proveedor es información interna de la cadena de
    importación (sección 15 del encargo)."""

    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer
    permission_classes = [IsAuthenticated, HasRole(*STAFF_ROLES)]
    filterset_fields = ["activo", "pais"]
    search_fields = ["razon_social", "nit"]
    ordering_fields = ["razon_social"]


class ClienteMayoristaViewSet(viewsets.ModelViewSet):
    """Administrador/Operador administran todos los clientes (RF-23). Un
    Cliente Mayorista solo consulta su propio registro, nunca el de otro
    (sección 37: filtrado obligatorio en `get_queryset`)."""

    serializer_class = ClienteMayoristaSerializer
    permission_classes = [
        IsAuthenticated,
        HasRole(*STAFF_ROLES, Roles.CLIENTE_MAYORISTA),
        IsOwnerClienteOrStaffReadOnly,
    ]
    filterset_fields = ["activo"]
    search_fields = ["razon_social", "nit"]
    ordering_fields = ["razon_social"]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, "rol_id", None) and user.rol.nombre == Roles.CLIENTE_MAYORISTA:
            return ClienteMayorista.objects.filter(usuario=user)
        return ClienteMayorista.objects.all()


class AgenteAduanalViewSet(viewsets.ModelViewSet):
    queryset = AgenteAduanal.objects.all()
    serializer_class = AgenteAduanalSerializer
    permission_classes = [IsAuthenticated, HasRole(*STAFF_ROLES)]
    search_fields = ["razon_social", "nit"]


class TransportistaViewSet(viewsets.ModelViewSet):
    queryset = Transportista.objects.all()
    serializer_class = TransportistaSerializer
    permission_classes = [IsAuthenticated, HasRole(*STAFF_ROLES)]
    filterset_fields = ["tipo_transporte", "activo"]
    search_fields = ["razon_social", "nit"]
