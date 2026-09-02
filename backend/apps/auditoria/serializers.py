from rest_framework import serializers

from .models import Bitacora


class BitacoraSerializer(serializers.ModelSerializer):
    """Forma de solo lectura de la bitácora (S4-T03). `entidad_tipo`
    expone el nombre de modelo de `entidad_content_type` en vez del `id`
    interno de `ContentType`, para que el frontend no necesite conocer
    esa tabla para mostrar algo legible."""

    entidad_tipo = serializers.SerializerMethodField()

    class Meta:
        model = Bitacora
        fields = [
            "id",
            "usuario",
            "usuario_repr",
            "accion",
            "entidad_tipo",
            "entidad_object_id",
            "detalle",
            "fecha_hora",
        ]
        read_only_fields = fields

    def get_entidad_tipo(self, obj) -> str | None:
        return obj.entidad_content_type.model if obj.entidad_content_type_id else None
