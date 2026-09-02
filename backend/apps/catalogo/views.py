from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.usuarios.permissions import HasRole, Roles

from .models import Prenda, VarianteProducto
from .serializers import PrendaSerializer, VarianteProductoSerializer

GESTION_CATALOGO_ROLES = (Roles.ADMINISTRADOR, Roles.OPERADOR_COMERCIO_EXTERIOR)


class PrendaViewSet(viewsets.ModelViewSet):
    """Catálogo de modelos (RF-01). Lectura para cualquier usuario
    autenticado, incluido el Cliente Mayorista (RF-14); escritura solo
    para Administrador/Operador de Comercio Exterior."""

    serializer_class = PrendaSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["categoria", "temporada", "coleccion", "activo"]
    search_fields = ["codigo_modelo", "nombre"]
    ordering_fields = ["codigo_modelo", "nombre", "created_at"]

    def get_queryset(self):
        queryset = Prenda.objects.all().prefetch_related("variantes")
        user = self.request.user
        if getattr(user, "rol_id", None) and user.rol.nombre == Roles.CLIENTE_MAYORISTA:
            # El catálogo mayorista solo muestra modelos activos con al
            # menos una variante publicada y con stock (sección 12/14 del
            # encargo; Sprint 3 S3-T01).
            queryset = queryset.filter(
                activo=True,
                variantes__estado=VarianteProducto.Estado.PUBLICADO,
                variantes__stock_disponible__gt=0,
            )

        # `talla`/`color` se manejan a mano (no vía `filterset_fields`)
        # porque ambos viven en la relación inversa `variantes`: si se
        # filtraran con dos `.filter()` encadenados (uno por campo), cada
        # uno haría su propio JOIN independiente y matchearía prendas cuya
        # talla X está en una variante y color Y en OTRA variante distinta.
        # Un único `.filter(variantes__talla=..., variantes__color=...)`
        # exige que ambos valores vivan en la MISMA fila de variante.
        talla = self.request.query_params.get("talla")
        color = self.request.query_params.get("color")
        if talla and color:
            queryset = queryset.filter(variantes__talla=talla, variantes__color=color)
        elif talla:
            queryset = queryset.filter(variantes__talla=talla)
        elif color:
            queryset = queryset.filter(variantes__color=color)

        # `.distinct()` es obligatorio siempre: cualquier filtro contra
        # `variantes` hace JOIN y puede repetir la misma Prenda una vez por
        # variante coincidente.
        return queryset.distinct()

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAuthenticated(), HasRole(*GESTION_CATALOGO_ROLES)()]
        return super().get_permissions()


class VarianteProductoViewSet(viewsets.ModelViewSet):
    """Variantes de talla/color (RF-01). El stock y el estado de
    publicación nunca se modifican por PATCH directo (sección 22 y RF-08):
    el stock lo gestiona `apps.inventario.services`, y la publicación pasa
    por la acción `publicar`."""

    serializer_class = VarianteProductoSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ["prenda", "talla", "color", "estado"]
    search_fields = ["prenda__codigo_modelo", "prenda__nombre"]
    ordering_fields = ["precio_unitario", "stock_disponible", "created_at"]

    def get_queryset(self):
        queryset = VarianteProducto.objects.select_related("prenda").all()
        user = self.request.user
        if getattr(user, "rol_id", None) and user.rol.nombre == Roles.CLIENTE_MAYORISTA:
            queryset = queryset.filter(estado=VarianteProducto.Estado.PUBLICADO, prenda__activo=True)
        return queryset

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy", "publicar"):
            return [IsAuthenticated(), HasRole(*GESTION_CATALOGO_ROLES)()]
        return super().get_permissions()

    @action(detail=True, methods=["post"])
    def publicar(self, request, pk=None):
        """POST /api/v1/variantes/{id}/publicar/ (RF-08): publica la
        variante tras la liberación aduanera. No es un PATCH de `estado`
        porque es una transición de negocio explícita, no una edición de
        campo (sección 8 del encargo)."""

        variante = self.get_object()
        with transaction.atomic():
            variante.estado = VarianteProducto.Estado.PUBLICADO
            variante.save(update_fields=["estado", "updated_at"])
        return Response(self.get_serializer(variante).data, status=status.HTTP_200_OK)
