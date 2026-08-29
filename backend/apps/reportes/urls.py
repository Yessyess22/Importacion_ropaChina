from django.urls import path

from .views import ReporteImportacionesView, ReportePedidosView

urlpatterns = [
    path("reportes/importaciones/", ReporteImportacionesView.as_view(), name="reporte-importaciones"),
    path("reportes/pedidos/", ReportePedidosView.as_view(), name="reporte-pedidos"),
]
