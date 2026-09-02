from django.utils.text import get_valid_filename
from rest_framework import serializers

from apps.core.validators import validar_fecha_no_futura

from .models import Documento

# Checklist #9 (docs/10-PLAN_VALIDACIONES.md, Sprint 9): tipos permitidos y
# tamaño máximo de los documentos adjuntos a una operación de importación
# (factura, BL, packing list, certificado de origen).
EXTENSIONES_PERMITIDAS = {"pdf", "jpg", "jpeg", "png"}
TAMANO_MAXIMO_MB = 10
TAMANO_MAXIMO_BYTES = TAMANO_MAXIMO_MB * 1024 * 1024


class DocumentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Documento
        fields = ["id", "operacion", "tipo", "nombre", "archivo", "fecha_emision", "created_at"]

    def validate_fecha_emision(self, value):
        # Checklist #7: la fecha de emisión de un documento de respaldo
        # (factura, BL, etc.) no puede ser posterior a hoy.
        if value:
            validar_fecha_no_futura(value)
        return value

    def validate_archivo(self, value):
        if not value:
            return value

        extension = value.name.rsplit(".", 1)[-1].lower() if "." in value.name else ""
        if extension not in EXTENSIONES_PERMITIDAS:
            raise serializers.ValidationError(
                f"Extensión no permitida. Solo se aceptan: {', '.join(sorted(EXTENSIONES_PERMITIDAS))}."
            )
        if value.size > TAMANO_MAXIMO_BYTES:
            raise serializers.ValidationError(
                f"El archivo supera el tamaño máximo permitido ({TAMANO_MAXIMO_MB} MB)."
            )

        # Defensa en profundidad: el storage de Django ya sanea el nombre
        # al guardar (`FileSystemStorage.get_valid_name`), pero se normaliza
        # aquí también para que el nombre ya saneado sea visible en la
        # respuesta del propio request de creación, no solo tras refrescar.
        value.name = get_valid_filename(value.name)
        return value
