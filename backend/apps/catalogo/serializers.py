from rest_framework import serializers

from apps.usuarios.permissions import Roles

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
    variantes = serializers.SerializerMethodField()

    class Meta:
        model = Prenda
        fields = [
            "id", "codigo_modelo", "nombre", "categoria", "temporada",
            "coleccion", "descripcion", "activo", "created_at", "updated_at",
            "variantes",
        ]

    def get_variantes(self, prenda):
        # El related manager `prenda.variantes` no respeta el filtro de
        # visibilidad aplicado al queryset de PrendaViewSet (ese filtro solo
        # decide qué Prenda entra en la lista, no qué variantes anida). Sin
        # este filtro adicional, un Cliente Mayorista vería variantes en
        # BORRADOR o sin stock anidadas dentro de una Prenda que sí tiene
        # otra variante publicada (RF-14 / Sprint 3: "solo variantes
        # publicadas con stock > 0").
        variantes = prenda.variantes.all()
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if user is not None and getattr(user, "rol_id", None) and user.rol.nombre == Roles.CLIENTE_MAYORISTA:
            variantes = variantes.filter(
                estado=VarianteProducto.Estado.PUBLICADO, stock_disponible__gt=0
            )
        return VarianteProductoNestedSerializer(variantes, many=True).data
