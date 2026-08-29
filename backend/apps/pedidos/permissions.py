from rest_framework.permissions import BasePermission

from apps.usuarios.permissions import Roles


class IsOwnerPedidoOrStaff(BasePermission):
    """Un Cliente Mayorista solo accede a sus propios pedidos (RF-15,
    sección 37): nunca a los de otro cliente. Sirve tanto para
    `PedidoMayorista` (tiene `cliente_id`) como para `DetallePedido`
    (accede a través de `pedido.cliente_id`). El resto de roles
    autorizados (ya filtrados antes por `HasRole`) tiene acceso completo.
    """

    def has_object_permission(self, request, view, obj):
        user = request.user
        if getattr(user, "rol_id", None) and user.rol.nombre == Roles.CLIENTE_MAYORISTA:
            cliente = getattr(user, "cliente_mayorista", None)
            if cliente is None:
                return False
            cliente_id = getattr(obj, "cliente_id", None)
            if cliente_id is None:
                cliente_id = obj.pedido.cliente_id
            return cliente_id == cliente.id
        return True
