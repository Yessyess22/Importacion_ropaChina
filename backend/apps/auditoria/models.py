from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models


class Bitacora(models.Model):
    """Registro de auditoría de operaciones críticas del sistema.

    `usuario` usa SET_NULL: el registro de auditoría debe sobrevivir aunque
    la cuenta de usuario se elimine más adelante; `usuario_repr` guarda un
    snapshot del nombre de usuario para que el log siga siendo legible en
    ese caso. `entidad_afectada` se modela con el framework de
    contenttypes (GenericForeignKey) en vez de un CharField libre con el
    nombre del modelo, para mantener una referencia consistente y evitar
    errores de tipeo.

    No se implementa aquí el registro automático (señales/middleware): esta
    fase solo define la estructura.
    """

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="acciones_bitacora",
    )
    usuario_repr = models.CharField(max_length=150, blank=True)
    accion = models.CharField(max_length=100)
    entidad_content_type = models.ForeignKey(
        ContentType, on_delete=models.SET_NULL, null=True, blank=True
    )
    entidad_object_id = models.PositiveBigIntegerField(null=True, blank=True)
    entidad_afectada = GenericForeignKey("entidad_content_type", "entidad_object_id")
    detalle = models.JSONField(blank=True, default=dict)
    fecha_hora = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Registro de bitácora"
        verbose_name_plural = "Bitácora"
        ordering = ["-fecha_hora"]
        indexes = [models.Index(fields=["fecha_hora"]), models.Index(fields=["accion"])]

    def __str__(self) -> str:
        return f"{self.fecha_hora} - {self.accion}"
