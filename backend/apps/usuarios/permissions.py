from rest_framework.permissions import BasePermission


class Roles:
    """Nombres de `Rol.nombre` tal como los crea `seed_dev_data` (los cinco
    roles exactos de la Fase 3). Se usan como identificadores estables para
    autorización en vez de repetir los literales en cada permiso/vista.
    """

    ADMINISTRADOR = "Administrador"
    OPERADOR_COMERCIO_EXTERIOR = "Operador de Comercio Exterior"
    AGENTE_ADUANAL = "Agente Aduanal"
    CONTABILIDAD = "Contabilidad"
    CLIENTE_MAYORISTA = "Cliente Mayorista"


def HasRole(*roles: str):
    """Fábrica de permisos DRF parametrizable por rol.

    Se usa una sola clase configurable (en vez de una clase por rol) para los
    permisos de los endpoints de negocio de fases futuras, p. ej.:
    `permission_classes = [IsAuthenticated, HasRole(Roles.ADMINISTRADOR)]`.
    """

    class _HasRole(BasePermission):
        message = "No tiene permisos para realizar esta acción."

        def has_permission(self, request, view):
            user = request.user
            return bool(
                user
                and user.is_authenticated
                and user.rol_id
                and user.rol.nombre in roles
            )

    return _HasRole
