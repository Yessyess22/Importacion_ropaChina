from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Rol, Usuario


@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ("nombre", "activo")
    search_fields = ("nombre",)


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (("Dominio", {"fields": ("rol",)}),)
    list_display = ("username", "email", "rol", "is_staff", "is_active")
    list_filter = UserAdmin.list_filter + ("rol",)
