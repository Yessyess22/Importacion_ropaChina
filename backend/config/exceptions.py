from django.db.models import ProtectedError
from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


class ConflictError(APIException):
    """Error 409: la petición es válida en sí misma, pero entra en
    conflicto con el estado actual del recurso (transición de estado no
    permitida, stock insuficiente, cantidad mínima incumplida, etc.).

    Se usa en los `services.py` de dominio en vez de
    `django.core.exceptions.ValidationError` porque DRF no traduce esa
    excepción automáticamente a una respuesta HTTP; `APIException` sí.
    """

    status_code = status.HTTP_409_CONFLICT
    default_detail = "La operación no es válida en el estado actual del recurso."
    default_code = "conflict"


def custom_exception_handler(exc, context):
    """Agrega a los defaults de DRF la conversión de `ProtectedError` (que
    Django lanza al intentar eliminar un registro referenciado por FKs
    `on_delete=PROTECT`, p. ej. un Proveedor con importaciones) en un 409
    consistente, en vez de dejarlo escalar a un 500 con traceback
    (sección 35 del encargo: nunca exponer tracebacks ni detalles internos).
    """

    if isinstance(exc, ProtectedError):
        return Response(
            {
                "detail": (
                    "No se puede eliminar: existen registros relacionados que dependen de este recurso."
                )
            },
            status=status.HTTP_409_CONFLICT,
        )
    return drf_exception_handler(exc, context)
