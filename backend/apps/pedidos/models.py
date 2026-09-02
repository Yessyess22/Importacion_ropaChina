from django.db import models

from apps.catalogo.models import VarianteProducto
from apps.terceros.models import ClienteMayorista


class PedidoMayorista(models.Model):
    """Pedido realizado por un cliente mayorista sobre el catálogo
    publicado."""

    class Estado(models.TextChoices):
        PENDIENTE = "PENDIENTE", "Pendiente"
        CONFIRMADO = "CONFIRMADO", "Confirmado"
        EN_PREPARACION = "EN_PREPARACION", "En preparación"
        ENVIADO = "ENVIADO", "Enviado"
        ENTREGADO = "ENTREGADO", "Entregado"
        CANCELADO = "CANCELADO", "Cancelado"

    codigo_pedido = models.CharField(max_length=30, unique=True)
    cliente = models.ForeignKey(ClienteMayorista, on_delete=models.PROTECT, related_name="pedidos")
    fecha = models.DateField()
    estado = models.CharField(max_length=20, choices=Estado.choices, default=Estado.PENDIENTE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Pedido mayorista"
        verbose_name_plural = "Pedidos mayoristas"
        ordering = ["-fecha"]
        indexes = [models.Index(fields=["estado"]), models.Index(fields=["fecha"])]

    def __str__(self) -> str:
        return self.codigo_pedido


class DetallePedido(models.Model):
    """Línea de un pedido mayorista.

    `precio_unitario` se guarda como snapshot histórico (no se referencia el
    precio vigente de VarianteProducto): si el precio cambia después, los
    pedidos ya realizados no deben verse afectados retroactivamente.
    """

    pedido = models.ForeignKey(PedidoMayorista, on_delete=models.CASCADE, related_name="detalles")
    variante = models.ForeignKey(VarianteProducto, on_delete=models.PROTECT, related_name="detalles_pedido")
    cantidad = models.PositiveIntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        verbose_name = "Detalle de pedido"
        verbose_name_plural = "Detalles de pedido"
        constraints = [
            models.UniqueConstraint(fields=["pedido", "variante"], name="unique_variante_por_pedido")
        ]

    def __str__(self) -> str:
        return f"{self.pedido.codigo_pedido} - {self.variante}"
