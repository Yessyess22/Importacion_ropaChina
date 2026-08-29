from django.contrib import admin

from .models import AgenteAduanal, ClienteMayorista, Proveedor, Transportista


@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ("razon_social", "nit", "fabrica", "ciudad_origen", "pais", "activo")
    search_fields = ("razon_social", "nit")
    list_filter = ("activo", "pais")


@admin.register(ClienteMayorista)
class ClienteMayoristaAdmin(admin.ModelAdmin):
    list_display = (
        "razon_social",
        "nit",
        "tipo_negocio",
        "pedido_minimo_modelo",
        "activo",
    )
    search_fields = ("razon_social", "nit")
    list_filter = ("activo",)


@admin.register(AgenteAduanal)
class AgenteAduanalAdmin(admin.ModelAdmin):
    list_display = ("razon_social", "nit", "numero_registro", "activo")
    search_fields = ("razon_social", "nit")


@admin.register(Transportista)
class TransportistaAdmin(admin.ModelAdmin):
    list_display = ("razon_social", "nit", "tipo_transporte", "activo")
    search_fields = ("razon_social", "nit")
    list_filter = ("tipo_transporte", "activo")
