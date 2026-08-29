from django.contrib import admin

from .models import Prenda, VarianteProducto


class VarianteProductoInline(admin.TabularInline):
    model = VarianteProducto
    extra = 0


@admin.register(Prenda)
class PrendaAdmin(admin.ModelAdmin):
    list_display = ("codigo_modelo", "nombre", "categoria", "temporada", "activo")
    search_fields = ("codigo_modelo", "nombre")
    list_filter = ("categoria", "temporada", "activo")
    inlines = [VarianteProductoInline]


@admin.register(VarianteProducto)
class VarianteProductoAdmin(admin.ModelAdmin):
    list_display = (
        "prenda",
        "talla",
        "color",
        "precio_unitario",
        "stock_disponible",
        "estado",
    )
    list_filter = ("estado", "talla", "color")
    search_fields = ("prenda__codigo_modelo", "prenda__nombre")
