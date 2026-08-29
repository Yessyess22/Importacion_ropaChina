from rest_framework.permissions import SAFE_METHODS, BasePermission

from apps.usuarios.permissions import Roles


class IsOwnerClienteOrStaffReadOnly(BasePermission):
    """Un Cliente Mayorista solo puede *consultar* (nunca crear, editar ni
    eliminar) su propio registro de `ClienteMayorista` (sección 23: "el
    cliente autenticado debe poder consultar sus propios datos... NO
    permitir que un cliente consulte otro cliente"). El resto de roles
    autorizados (ya filtrados antes por `HasRole` en el viewset) conserva
    acceso completo de lectura/escritura.
    """

    def has_permission(self, request, view):
        user = request.user
        if getattr(user, "rol_id", None) and user.rol.nombre == Roles.CLIENTE_MAYORISTA:
            return request.method in SAFE_METHODS
        return True

    def has_object_permission(self, request, view, obj):
        user = request.user
        if getattr(user, "rol_id", None) and user.rol.nombre == Roles.CLIENTE_MAYORISTA:
            return request.method in SAFE_METHODS and obj.usuario_id == user.id
        return True
