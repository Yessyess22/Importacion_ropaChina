from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models

from apps.catalogo.models import VarianteProducto
from apps.terceros.models import AgenteAduanal, Proveedor, Transportista


class OperacionImportacion(models.Model):
    """Operación de importación registrada desde un proveedor hasta su
    liberación aduanera.

    `valor_cif` es un campo persistido (no una @property) para poder
    filtrar/ordenar por él en reportes (RF-11), pero solo debe modificarse
    mediante el servicio de costeo (Fase futura) a partir de
    valor_fob + valor_flete + valor_seguro, nunca editado a mano.
    """

    class Estado(models.TextChoices):
        REGISTRADA = "REGISTRADA", "Registrada"
        EN_TRANSITO = "EN_TRANSITO", "En tránsito"
        EN_ADUANA = "EN_ADUANA", "En aduana"
        LIBERADA = "LIBERADA", "Liberada"
        CANCELADA = "CANCELADA", "Cancelada"

    codigo_unico = models.CharField(max_length=30, unique=True)
    proveedor = models.ForeignKey(Proveedor, on_delete=models.PROTECT, related_name="operaciones_importacion")
    agente_aduanal = models.ForeignKey(
        AgenteAduanal,
        on_delete=models.PROTECT,
        related_name="operaciones_importacion",
        null=True,
        blank=True,
    )
    transportista = models.ForeignKey(
        Transportista,
        on_delete=models.PROTECT,
        related_name="operaciones_importacion",
        null=True,
        blank=True,
    )
    fecha_registro = models.DateField()
    estado = models.CharField(max_length=20, choices=Estado.choices, default=Estado.REGISTRADA)
    valor_fob = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0"))]
    )
    valor_flete = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0"))]
    )
    valor_seguro = models.DecimalField(
        max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal("0"))]
    )
    valor_cif = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    ruta_ingreso = models.CharField(max_length=150, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Operación de importación"
        verbose_name_plural = "Operaciones de importación"
        ordering = ["-fecha_registro"]
        indexes = [
            models.Index(fields=["estado"]),
            models.Index(fields=["fecha_registro"]),
        ]

    def __str__(self) -> str:
        return self.codigo_unico


class DetalleImportacion(models.Model):
    """Línea de detalle que resuelve la relación real entre una operación de
    importación y las variantes de producto que ingresan en ella.

    Se introduce esta entidad intermedia (en vez de una FK directa
    VarianteProducto -> OperacionImportacion) porque una misma variante
    (talla/color) puede reabastecerse en importaciones distintas a lo largo
    del tiempo, y una operación normalmente trae múltiples variantes. Una FK
    directa forzaría una relación 1:N incorrecta que ataría cada variante a
    una única importación para siempre.
    """

    operacion = models.ForeignKey(OperacionImportacion, on_delete=models.CASCADE, related_name="detalles")
    variante = models.ForeignKey(
        VarianteProducto, on_delete=models.PROTECT, related_name="detalles_importacion"
    )
    cantidad = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    costo_unitario_fob = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))]
    )

    class Meta:
        verbose_name = "Detalle de importación"
        verbose_name_plural = "Detalles de importación"
        constraints = [
            models.UniqueConstraint(fields=["operacion", "variante"], name="unique_variante_por_operacion")
        ]

    def __str__(self) -> str:
        return f"{self.operacion.codigo_unico} - {self.variante}"
