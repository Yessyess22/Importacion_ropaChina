from django.conf import settings
from django.db import models


class Tercero(models.Model):
    """Clase base abstracta para las distintas personas/empresas con las que
    interactúa el sistema (proveedores, clientes mayoristas, agentes
    aduanales, transportistas).

    Es una clase abstracta de Django (no herencia multi-tabla ni una tabla
    única con discriminador): cada subtipo obtiene su propia tabla completa,
    sin columnas nulas ajenas a su dominio, y sin el JOIN adicional que
    implicaría la herencia multi-tabla. Ver docs/database.md para la
    justificación completa.
    """

    razon_social = models.CharField(max_length=255)
    nit = models.CharField(max_length=30, unique=True)
    telefono = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    direccion = models.CharField(max_length=255, blank=True)
    activo = models.BooleanField(default=True)

    class Meta:
        abstract = True
        ordering = ["razon_social"]

    def __str__(self) -> str:
        return self.razon_social


class Proveedor(Tercero):
    """Fábrica/proveedor de origen (típicamente en China) de una operación
    de importación."""

    fabrica = models.CharField(max_length=255, blank=True)
    ciudad_origen = models.CharField(max_length=100, blank=True)
    pais = models.CharField(max_length=100, default="China")

    class Meta:
        verbose_name = "Proveedor"
        verbose_name_plural = "Proveedores"
        ordering = ["razon_social"]
        indexes = [models.Index(fields=["razon_social"])]


class ClienteMayorista(Tercero):
    """Cliente que compra al por mayor a través del catálogo publicado."""

    tipo_negocio = models.CharField(max_length=100, blank=True)
    pedido_minimo_modelo = models.PositiveIntegerField(
        default=1,
        help_text="Cantidad mínima exigida por modelo (Prenda) en cada pedido de este cliente.",
    )
    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cliente_mayorista",
        help_text="Cuenta de acceso al portal mayorista asociada a este cliente (opcional).",
    )

    class Meta:
        verbose_name = "Cliente mayorista"
        verbose_name_plural = "Clientes mayoristas"
        ordering = ["razon_social"]
        indexes = [models.Index(fields=["razon_social"])]


class AgenteAduanal(Tercero):
    """Agente/agencia aduanal encargado del despacho de una operación de
    importación."""

    numero_registro = models.CharField(max_length=50, blank=True)

    class Meta:
        verbose_name = "Agente aduanal"
        verbose_name_plural = "Agentes aduanales"
        ordering = ["razon_social"]


class Transportista(Tercero):
    """Empresa de transporte responsable de una ruta de ingreso."""

    class TipoTransporte(models.TextChoices):
        MARITIMO = "MARITIMO", "Marítimo"
        AEREO = "AEREO", "Aéreo"
        TERRESTRE = "TERRESTRE", "Terrestre"

    tipo_transporte = models.CharField(max_length=20, choices=TipoTransporte.choices, blank=True)

    class Meta:
        verbose_name = "Transportista"
        verbose_name_plural = "Transportistas"
        ordering = ["razon_social"]
