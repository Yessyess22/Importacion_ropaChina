from django.contrib import admin

from .models import Costeo, TipoCambio, Tributo


class TributoInline(admin.TabularInline):
    model = Tributo
    extra = 0


@admin.register(Costeo)
class CosteoAdmin(admin.ModelAdmin):
    list_display = ("operacion", "costo_total", "fecha_calculo")
    search_fields = ("operacion__codigo_unico",)
    inlines = [TributoInline]


@admin.register(Tributo)
class TributoAdmin(admin.ModelAdmin):
    list_display = ("costeo", "tipo", "base_imponible", "porcentaje", "monto")
    list_filter = ("tipo",)


@admin.register(TipoCambio)
class TipoCambioAdmin(admin.ModelAdmin):
    list_display = ("fecha", "valor")
    ordering = ("-fecha",)
