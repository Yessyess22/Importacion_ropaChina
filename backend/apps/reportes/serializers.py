from rest_framework import serializers


class ResumenPorEstadoSerializer(serializers.Serializer):
    """Forma de la respuesta de los reportes de agregación (RF-11): no
    respaldan ningún modelo persistido, solo documentan la salida de
    `values(...).annotate(...)` para que aparezca en el schema OpenAPI."""

    estado = serializers.CharField()
    cantidad = serializers.IntegerField()


class ResumenImportacionesSerializer(ResumenPorEstadoSerializer):
    total_cif = serializers.DecimalField(max_digits=12, decimal_places=2, allow_null=True)
