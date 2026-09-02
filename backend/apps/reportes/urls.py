from django.urls import path

from .views import (
    ReporteImportacionesDetalleView,
    ReporteImportacionesView,
    ReportePedidosDetalleView,
    ReportePedidosView,
)

urlpatterns = [
    path("reportes/importaciones/", ReporteImportacionesView.as_view(), name="reporte-importaciones"),
    path(
        "reportes/importaciones/detalle/",
        ReporteImportacionesDetalleView.as_view(),
        name="reporte-importaciones-detalle",
    ),
    path("reportes/pedidos/", ReportePedidosView.as_view(), name="reporte-pedidos"),
    path("reportes/pedidos/detalle/", ReportePedidosDetalleView.as_view(), name="reporte-pedidos-detalle"),
]
