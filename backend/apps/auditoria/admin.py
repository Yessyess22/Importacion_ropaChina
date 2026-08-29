from django.contrib import admin

from .models import Bitacora


@admin.register(Bitacora)
class BitacoraAdmin(admin.ModelAdmin):
    list_display = ("fecha_hora", "usuario_repr", "accion", "entidad_content_type")
    list_filter = ("accion",)
    readonly_fields = [f.name for f in Bitacora._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
