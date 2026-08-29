from django.contrib import admin

from .models import MovimientoInventario


@admin.register(MovimientoInventario)
class MovimientoInventarioAdmin(admin.ModelAdmin):
    list_display = ("variante", "tipo", "cantidad", "fecha")
    list_filter = ("tipo",)
    search_fields = ("variante__prenda__codigo_modelo",)
