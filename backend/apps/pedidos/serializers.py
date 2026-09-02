from rest_framework import serializers

from apps.catalogo.models import VarianteProducto
from apps.catalogo.serializers import VarianteProductoNestedSerializer
from apps.terceros.models import ClienteMayorista

from .models import DetallePedido, PedidoMayorista


class DetallePedidoNestedSerializer(serializers.ModelSerializer):
    variante_detalle = VarianteProductoNestedSerializer(source="variante", read_only=True)

    class Meta:
        model = DetallePedido
        fields = ["id", "variante", "variante_detalle", "cantidad", "precio_unitario"]
        read_only_fields = ["precio_unitario"]


class DetallePedidoSerializer(serializers.ModelSerializer):
    variante_detalle = VarianteProductoNestedSerializer(source="variante", read_only=True)

    class Meta:
        model = DetallePedido
        fields = ["id", "pedido", "variante", "variante_detalle", "cantidad", "precio_unitario"]
        read_only_fields = ["precio_unitario"]


class PedidoMayoristaSerializer(serializers.ModelSerializer):
    """Serializer de lectura: todo el pedido (incluidos sus `detalles`) es
    de solo lectura por esta vía. La creación pasa por
    `PedidoMayoristaCreateSerializer` + `services.crear_pedido`, y el
    cambio de estado por la acción `actualizar-estado` (sección 25/27)."""

    detalles = DetallePedidoNestedSerializer(many=True, read_only=True)

    class Meta:
        model = PedidoMayorista
        fields = [
            "id",
            "codigo_pedido",
            "cliente",
            "fecha",
            "estado",
            "created_at",
            "updated_at",
            "detalles",
        ]
        read_only_fields = fields


class DetallePedidoInputSerializer(serializers.Serializer):
    variante = serializers.PrimaryKeyRelatedField(queryset=VarianteProducto.objects.all())
    cantidad = serializers.IntegerField(min_value=1)


class PedidoMayoristaCreateSerializer(serializers.Serializer):
    """Escritura: crea el pedido y sus detalles en una sola operación
    atómica vía `services.crear_pedido` (secciones 11, 26 y 27 del
    encargo). `cliente` es opcional aquí porque, si quien pide es un
    Cliente Mayorista, la vista lo resuelve a partir de la sesión, nunca
    del payload (para que un cliente no pueda pedir a nombre de otro)."""

    cliente = serializers.PrimaryKeyRelatedField(queryset=ClienteMayorista.objects.all(), required=False)
    detalles = DetallePedidoInputSerializer(many=True)

    def validate_detalles(self, detalles):
        if not detalles:
            raise serializers.ValidationError("El pedido debe tener al menos un detalle.")
        return detalles


class CambiarEstadoPedidoSerializer(serializers.Serializer):
    estado = serializers.ChoiceField(choices=PedidoMayorista.Estado.choices)
