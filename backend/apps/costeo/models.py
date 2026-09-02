from django.db import models

from apps.importaciones.models import OperacionImportacion


class Costeo(models.Model):
    """Resultado del costeo de una operación de importación.

    No repite valor_fob/flete/seguro/cif (ya viven en OperacionImportacion)
    para evitar duplicar datos que podrían desincronizarse; solo agrega el
    costo total de nacionalización (CIF + tributos). `costo_total` es un
    campo persistido actualizado por servicio, por la misma razón que
    OperacionImportacion.valor_cif.
    """

    operacion = models.OneToOneField(OperacionImportacion, on_delete=models.CASCADE, related_name="costeo")
    costo_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    fecha_calculo = models.DateTimeField(auto_now=True)
    observaciones = models.TextField(blank=True)

    class Meta:
        verbose_name = "Costeo"
        verbose_name_plural = "Costeos"

    def __str__(self) -> str:
        return f"Costeo de {self.operacion.codigo_unico}"


class Tributo(models.Model):
    """Concepto tributario (arancel, IVA) aplicado a un costeo."""

    class Tipo(models.TextChoices):
        ARANCEL = "ARANCEL", "Arancel"
        IVA = "IVA", "IVA"

    costeo = models.ForeignKey(Costeo, on_delete=models.CASCADE, related_name="tributos")
    tipo = models.CharField(max_length=10, choices=Tipo.choices)
    partida_arancelaria = models.CharField(max_length=20, blank=True)
    base_imponible = models.DecimalField(max_digits=12, decimal_places=2)
    porcentaje = models.DecimalField(max_digits=5, decimal_places=2)
    monto = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        verbose_name = "Tributo"
        verbose_name_plural = "Tributos"

    def __str__(self) -> str:
        return f"{self.get_tipo_display()} - {self.costeo.operacion.codigo_unico}"


class TipoCambio(models.Model):
    """Tipo de cambio diario USD/BOB.

    No se agregan campos moneda_origen/moneda_destino: el proyecto solo
    requiere el par USD/BOB (RF-10), así que agregarlos sería
    generalización especulativa no solicitada. `fecha` es unique para
    evitar registros ambiguos del mismo día.
    """

    fecha = models.DateField(unique=True)
    valor = models.DecimalField(max_digits=6, decimal_places=4)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Tipo de cambio"
        verbose_name_plural = "Tipos de cambio"
        ordering = ["-fecha"]

    def __str__(self) -> str:
        return f"{self.fecha}: {self.valor}"
