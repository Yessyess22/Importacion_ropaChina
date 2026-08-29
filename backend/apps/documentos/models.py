from django.db import models

from apps.importaciones.models import OperacionImportacion


class Documento(models.Model):
    """Documento asociado a una operación de importación (factura, BL,
    packing list, certificado de origen).

    El modelo queda preparado para almacenar archivo (FileField sobre
    almacenamiento local en esta fase) aunque la subida desde React se
    implementará en una fase posterior.
    """

    class Tipo(models.TextChoices):
        FACTURA = "FACTURA", "Factura"
        BL = "BL", "Bill of Lading"
        PACKING_LIST = "PACKING_LIST", "Packing list"
        CERTIFICADO_ORIGEN = "CERTIFICADO_ORIGEN", "Certificado de origen"
        OTRO = "OTRO", "Otro"

    operacion = models.ForeignKey(
        OperacionImportacion, on_delete=models.CASCADE, related_name="documentos"
    )
    tipo = models.CharField(max_length=25, choices=Tipo.choices)
    nombre = models.CharField(max_length=150, blank=True)
    archivo = models.FileField(upload_to="documentos/%Y/%m/", blank=True, null=True)
    fecha_emision = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Documento"
        verbose_name_plural = "Documentos"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["tipo"])]

    def __str__(self) -> str:
        return f"{self.get_tipo_display()} - {self.operacion.codigo_unico}"
