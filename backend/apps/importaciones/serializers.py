from rest_framework import serializers

from apps.catalogo.serializers import VarianteProductoNestedSerializer

from .models import DetalleImportacion, OperacionImportacion


class DetalleImportacionNestedSerializer(serializers.ModelSerializer):
    variante_detalle = VarianteProductoNestedSerializer(source="variante", read_only=True)

    class Meta:
        model = DetalleImportacion
        fields = ["id", "variante", "variante_detalle", "cantidad", "costo_unitario_fob"]


class DetalleImportacionSerializer(serializers.ModelSerializer):
    variante_detalle = VarianteProductoNestedSerializer(source="variante", read_only=True)

    class Meta:
        model = DetalleImportacion
        fields = ["id", "operacion", "variante", "variante_detalle", "cantidad", "costo_unitario_fob"]

    def validate_operacion(self, operacion):
        # No se pueden agregar líneas nuevas a una operación ya liberada o
        # cancelada: la entrada de stock (RF-09) ya se disparó (o nunca se
        # disparará) para esa operación, y agregar detalles después
        # dejaría el stock desincronizado con lo realmente importado.
        if self.instance is None and operacion.estado in (
            OperacionImportacion.Estado.LIBERADA,
            OperacionImportacion.Estado.CANCELADA,
        ):
            raise serializers.ValidationError(
                "No se pueden agregar detalles a una operación liberada o cancelada."
            )
        return operacion


class OperacionImportacionSerializer(serializers.ModelSerializer):
    detalles = DetalleImportacionNestedSerializer(many=True, read_only=True)

    class Meta:
        model = OperacionImportacion
        fields = [
            "id",
            "codigo_unico",
            "proveedor",
            "agente_aduanal",
            "transportista",
            "fecha_registro",
            "estado",
            "valor_fob",
            "valor_flete",
            "valor_seguro",
            "valor_cif",
            "ruta_ingreso",
            "created_at",
            "updated_at",
            "detalles",
        ]
        # `estado` solo cambia vía la acción `actualizar-estado` (RF-07);
        # `valor_cif` SIEMPRE lo calcula `services.calcular_cif` (RF-04):
        # nunca se acepta el valor que envíe el cliente HTTP.
        read_only_fields = ["estado", "valor_cif", "created_at", "updated_at"]


class CambiarEstadoOperacionSerializer(serializers.Serializer):
    estado = serializers.ChoiceField(choices=OperacionImportacion.Estado.choices)
