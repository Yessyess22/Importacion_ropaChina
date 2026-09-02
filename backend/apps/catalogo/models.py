from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models


class Prenda(models.Model):
    """Modelo (diseño) de prenda del catálogo. Representa el concepto de
    negocio "modelo", independiente de sus combinaciones de talla/color,
    que se modelan en VarianteProducto."""

    codigo_modelo = models.CharField(max_length=30, unique=True)
    nombre = models.CharField(max_length=150)
    categoria = models.CharField(max_length=100, blank=True)
    temporada = models.CharField(max_length=50, blank=True)
    coleccion = models.CharField(max_length=100, blank=True)
    descripcion = models.TextField(blank=True)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Prenda"
        verbose_name_plural = "Prendas"
        ordering = ["codigo_modelo"]

    def __str__(self) -> str:
        return f"{self.codigo_modelo} - {self.nombre}"


class VarianteProducto(models.Model):
    """Combinación concreta de talla y color de una Prenda, unidad real de
    stock, precio y publicación en el catálogo."""

    class Estado(models.TextChoices):
        BORRADOR = "BORRADOR", "Borrador"
        PUBLICADO = "PUBLICADO", "Publicado"
        DESCONTINUADO = "DESCONTINUADO", "Descontinuado"

    prenda = models.ForeignKey(Prenda, on_delete=models.PROTECT, related_name="variantes")
    talla = models.CharField(max_length=20)
    color = models.CharField(max_length=50)
    precio_unitario = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))]
    )
    stock_disponible = models.PositiveIntegerField(
        default=0,
        help_text=(
            "Contador de stock mantenido por servicios de inventario a partir de "
            "MovimientoInventario. No editar directamente salvo ajuste controlado."
        ),
    )
    estado = models.CharField(max_length=20, choices=Estado.choices, default=Estado.BORRADOR)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Variante de producto"
        verbose_name_plural = "Variantes de producto"
        ordering = ["prenda", "talla", "color"]
        constraints = [
            models.UniqueConstraint(fields=["prenda", "talla", "color"], name="unique_variante_por_prenda")
        ]
        indexes = [models.Index(fields=["estado"])]

    def __str__(self) -> str:
        return f"{self.prenda.codigo_modelo} / {self.talla} / {self.color}"
