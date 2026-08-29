"""Punto único de escritura de la bitácora (sección 39 del encargo).

No se implementa registro automático por señales/middleware en esta fase:
cada servicio de dominio que ejecuta una operación crítica llama
explícitamente a `registrar(...)`. Esto deja explícito en el propio
código de negocio qué se audita y con qué detalle, en vez de acoplar
todas las apps a un mecanismo implícito. Nunca se registra información
sensible (contraseñas, tokens) en `detalle`.
"""
from django.contrib.contenttypes.models import ContentType

from .models import Bitacora


def registrar(usuario, accion, entidad=None, detalle=None):
    Bitacora.objects.create(
        usuario=usuario if usuario and usuario.is_authenticated else None,
        usuario_repr=getattr(usuario, "username", ""),
        accion=accion,
        entidad_content_type=ContentType.objects.get_for_model(entidad) if entidad else None,
        entidad_object_id=entidad.pk if entidad else None,
        detalle=detalle or {},
    )
