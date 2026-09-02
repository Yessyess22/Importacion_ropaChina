from django.db.models import Count, Sum
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.importaciones.models import OperacionImportacion
from apps.importaciones.serializers import OperacionImportacionSerializer
from apps.pedidos.models import PedidoMayorista
from apps.pedidos.serializers import PedidoMayoristaSerializer
from apps.usuarios.permissions import HasRole, Roles

from .serializers import ResumenImportacionesSerializer, ResumenPorEstadoSerializer

REPORTES_ROLES = (Roles.ADMINISTRADOR, Roles.OPERADOR_COMERCIO_EXTERIOR, Roles.CONTABILIDAD)


class ReporteImportacionesView(APIView):
    """GET /api/v1/reportes/importaciones/ (RF-11): conteo y valor CIF
    total agrupado por estado, con filtro opcional de rango de fechas."""

    permission_classes = [IsAuthenticated, HasRole(*REPORTES_ROLES)]

    @extend_schema(responses=ResumenImportacionesSerializer(many=True))
    def get(self, request):
        queryset = OperacionImportacion.objects.all()
        desde = request.query_params.get("fecha_desde")
        hasta = request.query_params.get("fecha_hasta")
        if desde:
            queryset = queryset.filter(fecha_registro__gte=desde)
        if hasta:
            queryset = queryset.filter(fecha_registro__lte=hasta)

        resumen = list(
            queryset.values("estado")
            .annotate(cantidad=Count("id"), total_cif=Sum("valor_cif"))
            .order_by("estado")
        )
        return Response({"por_estado": resumen})


class ReportePedidosView(APIView):
    """GET /api/v1/reportes/pedidos/ (RF-11): conteo de pedidos por
    estado, con filtro opcional por cliente."""

    permission_classes = [IsAuthenticated, HasRole(*REPORTES_ROLES)]

    @extend_schema(responses=ResumenPorEstadoSerializer(many=True))
    def get(self, request):
        queryset = PedidoMayorista.objects.all()
        cliente_id = request.query_params.get("cliente")
        if cliente_id:
            queryset = queryset.filter(cliente_id=cliente_id)

        resumen = list(queryset.values("estado").annotate(cantidad=Count("id")).order_by("estado"))
        return Response({"por_estado": resumen})


class ReporteImportacionesDetalleView(APIView):
    """GET /api/v1/reportes/importaciones/detalle/: una fila por cada
    operación (no agregada), para el reporte detallado exportable a PDF.
    Reusa `OperacionImportacionSerializer` tal cual (código, contraparte,
    fechas, valores y líneas ya vienen ahí), mismos filtros de fecha que
    el reporte agregado más `estado` opcional."""

    permission_classes = [IsAuthenticated, HasRole(*REPORTES_ROLES)]

    @extend_schema(responses=OperacionImportacionSerializer(many=True))
    def get(self, request):
        queryset = OperacionImportacion.objects.select_related(
            "proveedor", "agente_aduanal", "transportista"
        ).prefetch_related("detalles__variante__prenda")
        desde = request.query_params.get("fecha_desde")
        hasta = request.query_params.get("fecha_hasta")
        estado = request.query_params.get("estado")
        if desde:
            queryset = queryset.filter(fecha_registro__gte=desde)
        if hasta:
            queryset = queryset.filter(fecha_registro__lte=hasta)
        if estado:
            queryset = queryset.filter(estado=estado)

        queryset = queryset.order_by("-fecha_registro")
        return Response(OperacionImportacionSerializer(queryset, many=True).data)


class ReportePedidosDetalleView(APIView):
    """GET /api/v1/reportes/pedidos/detalle/: una fila por cada pedido
    (no agregado). Reusa `PedidoMayoristaSerializer` tal cual."""

    permission_classes = [IsAuthenticated, HasRole(*REPORTES_ROLES)]

    @extend_schema(responses=PedidoMayoristaSerializer(many=True))
    def get(self, request):
        queryset = PedidoMayorista.objects.select_related("cliente").prefetch_related("detalles__variante")
        cliente_id = request.query_params.get("cliente")
        desde = request.query_params.get("fecha_desde")
        hasta = request.query_params.get("fecha_hasta")
        estado = request.query_params.get("estado")
        if cliente_id:
            queryset = queryset.filter(cliente_id=cliente_id)
        if desde:
            queryset = queryset.filter(fecha__gte=desde)
        if hasta:
            queryset = queryset.filter(fecha__lte=hasta)
        if estado:
            queryset = queryset.filter(estado=estado)

        queryset = queryset.order_by("-fecha")
        return Response(PedidoMayoristaSerializer(queryset, many=True).data)
