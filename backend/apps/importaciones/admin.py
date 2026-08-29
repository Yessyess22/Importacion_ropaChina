from django.contrib import admin

from .models import DetalleImportacion, OperacionImportacion


class DetalleImportacionInline(admin.TabularInline):
    model = DetalleImportacion
    extra = 0


@admin.register(OperacionImportacion)
class OperacionImportacionAdmin(admin.ModelAdmin):
    list_display = (
        "codigo_unico",
        "proveedor",
        "estado",
        "fecha_registro",
        "valor_fob",
        "valor_flete",
        "valor_seguro",
        "valor_cif",
    )
    list_filter = ("estado",)
    search_fields = ("codigo_unico", "proveedor__razon_social")
    inlines = [DetalleImportacionInline]


@admin.register(DetalleImportacion)
class DetalleImportacionAdmin(admin.ModelAdmin):
    list_display = ("operacion", "variante", "cantidad", "costo_unitario_fob")
    search_fields = ("operacion__codigo_unico",)
