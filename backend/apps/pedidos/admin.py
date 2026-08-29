from django.contrib import admin

from .models import DetallePedido, PedidoMayorista


class DetallePedidoInline(admin.TabularInline):
    model = DetallePedido
    extra = 0


@admin.register(PedidoMayorista)
class PedidoMayoristaAdmin(admin.ModelAdmin):
    list_display = ("codigo_pedido", "cliente", "fecha", "estado")
    list_filter = ("estado",)
    search_fields = ("codigo_pedido", "cliente__razon_social")
    inlines = [DetallePedidoInline]


@admin.register(DetallePedido)
class DetallePedidoAdmin(admin.ModelAdmin):
    list_display = ("pedido", "variante", "cantidad", "precio_unitario")
    search_fields = ("pedido__codigo_pedido",)
