from rest_framework import serializers

from .models import Prenda, VarianteProducto


class VarianteProductoNestedSerializer(serializers.ModelSerializer):
    """Solo lectura: usada dentro de serializers de otras apps
    (importaciones, pedidos) para mostrar el detalle de la variante sin
    repetir su validación de escritura en un contexto anidado (sección 11
    del encargo)."""

    class Meta:
        model = VarianteProducto
        fields = ["id", "talla", "color", "precio_unitario", "stock_disponible", "estado"]


class VarianteProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = VarianteProducto
        fields = [
            "id", "prenda", "talla", "color", "precio_unitario",
            "stock_disponible", "estado", "created_at", "updated_at",
        ]
        # `stock_disponible` lo gestiona exclusivamente
        # `apps.inventario.services` (sección 22); `estado` solo cambia
        # vía la acción `publicar` (RF-08), nunca por PATCH directo.
        read_only_fields = ["stock_disponible", "estado", "created_at", "updated_at"]


class PrendaSerializer(serializers.ModelSerializer):
    variantes = VarianteProductoNestedSerializer(many=True, read_only=True)

    class Meta:
        model = Prenda
        fields = [
            "id", "codigo_modelo", "nombre", "categoria", "temporada",
            "coleccion", "descripcion", "activo", "created_at", "updated_at",
            "variantes",
        ]
