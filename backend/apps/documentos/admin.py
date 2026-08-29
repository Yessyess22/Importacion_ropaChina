from django.contrib import admin

from .models import Documento


@admin.register(Documento)
class DocumentoAdmin(admin.ModelAdmin):
    list_display = ("operacion", "tipo", "nombre", "fecha_emision")
    list_filter = ("tipo",)
    search_fields = ("operacion__codigo_unico", "nombre")
