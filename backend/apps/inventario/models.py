from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models

from apps.catalogo.models import VarianteProducto


class MovimientoInventario(models.Model):
    """Ledger de movimientos de stock de una VarianteProducto (entradas,
    salidas, ajustes).

    `stock_disponible` en VarianteProducto es el contador de lectura rápida
    para el catálogo (RF-09/RF-14); este modelo es la fuente de trazabilidad
    que respalda ese contador. El servicio que crea movimientos y actualiza
    el contador de forma atómica se implementará en una fase posterior; por
    ahora solo se define la estructura.

    `origen` es una referencia genérica opcional al registro que disparó el
    movimiento (por ejemplo un DetalleImportacion o un DetallePedido), ya
    que el origen puede provenir de apps distintas.
    """

    class Tipo(models.TextChoices):
        ENTRADA = "ENTRADA", "Entrada"
        SALIDA = "SALIDA", "Salida"
        AJUSTE = "AJUSTE", "Ajuste"

    variante = models.ForeignKey(VarianteProducto, on_delete=models.PROTECT, related_name="movimientos")
    tipo = models.CharField(max_length=10, choices=Tipo.choices)
    cantidad = models.IntegerField()
    origen_content_type = models.ForeignKey(ContentType, on_delete=models.SET_NULL, null=True, blank=True)
    origen_object_id = models.PositiveBigIntegerField(null=True, blank=True)
    origen = GenericForeignKey("origen_content_type", "origen_object_id")
    observacion = models.CharField(max_length=255, blank=True)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Movimiento de inventario"
        verbose_name_plural = "Movimientos de inventario"
        ordering = ["-fecha"]
        indexes = [models.Index(fields=["tipo"]), models.Index(fields=["fecha"])]

    def __str__(self) -> str:
        return f"{self.get_tipo_display()} {self.cantidad} - {self.variante}"
