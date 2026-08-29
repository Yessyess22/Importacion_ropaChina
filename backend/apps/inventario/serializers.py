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
