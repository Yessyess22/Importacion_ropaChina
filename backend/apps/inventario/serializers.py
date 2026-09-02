from rest_framework import serializers

from apps.catalogo.models import VarianteProducto

from .models import MovimientoInventario


class MovimientoInventarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovimientoInventario
        fields = ["id", "variante", "tipo", "cantidad", "observacion", "fecha"]
        read_only_fields = fields


class RegistrarMovimientoSerializer(serializers.Serializer):
    """Entrada de datos para las acciones `entrada`/`salida`. `cantidad`
    siempre se ingresa como valor positivo; el signo lo decide el
    servicio según el tipo de movimiento."""

    variante = serializers.PrimaryKeyRelatedField(queryset=VarianteProducto.objects.all())
    cantidad = serializers.IntegerField(min_value=1)
    observacion = serializers.CharField(required=False, allow_blank=True, default="")


class AjustarStockSerializer(serializers.Serializer):
    """`delta` puede ser positivo o negativo: un ajuste corrige el
    contador de stock en cualquier dirección (sobrante o faltante de
    inventario físico)."""

    variante = serializers.PrimaryKeyRelatedField(queryset=VarianteProducto.objects.all())
    delta = serializers.IntegerField()
    observacion = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_delta(self, value):
        if value == 0:
            raise serializers.ValidationError("El ajuste no puede ser 0: no representaría ningún cambio.")
        return value


class EditarMovimientoSerializer(serializers.Serializer):
    """Corrección administrativa (solo Administrador) de un movimiento ya
    registrado. `cantidad` es el delta firmado, con el mismo signo que ya
    almacena el modelo (positivo para Entrada, negativo para Salida,
    cualquier valor no nulo para Ajuste); la validación de que el signo
    coincida con el `tipo` del movimiento se hace en
    `services.editar_movimiento`, que sí tiene acceso a esa información."""

    cantidad = serializers.IntegerField()
    observacion = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_cantidad(self, value):
        if value == 0:
            raise serializers.ValidationError("La cantidad no puede ser 0.")
        return value
