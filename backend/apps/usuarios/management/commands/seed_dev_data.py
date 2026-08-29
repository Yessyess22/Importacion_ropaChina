"""Carga datos mínimos de desarrollo: roles, un usuario administrador de
prueba y un ejemplo de catálogo/proveedor para verificar el esquema.

No debe usarse en producción ni contener datos reales. La contraseña del
usuario de desarrollo se toma de la variable de entorno
DJANGO_DEV_ADMIN_PASSWORD (nunca se hardcodea ni se sube a Git); si no se
define, se genera una aleatoria y se imprime una sola vez en consola.
"""
import os
import secrets
from decimal import Decimal

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError


ROLES = [
    "Administrador",
    "Operador de Comercio Exterior",
    "Agente Aduanal",
    "Contabilidad",
    "Cliente Mayorista",
]


class Command(BaseCommand):
    help = "Crea roles, un usuario administrador de desarrollo y un ejemplo mínimo de catálogo."

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError(
                "seed_dev_data solo debe ejecutarse con DJANGO_DEBUG=True (entorno de desarrollo)."
            )

        from apps.catalogo.models import Prenda, VarianteProducto
        from apps.terceros.models import Proveedor
        from apps.usuarios.models import Rol, Usuario

        for nombre in ROLES:
            Rol.objects.get_or_create(nombre=nombre)
        self.stdout.write(self.style.SUCCESS(f"Roles asegurados: {', '.join(ROLES)}"))

        rol_admin = Rol.objects.get(nombre="Administrador")
        if not Usuario.objects.filter(username="admin").exists():
            password = os.environ.get("DJANGO_DEV_ADMIN_PASSWORD") or secrets.token_urlsafe(12)
            Usuario.objects.create_superuser(
                username="admin", email="admin@example.com", password=password, rol=rol_admin
            )
            self.stdout.write(
                self.style.WARNING(
                    f"Usuario de desarrollo creado -> username: admin / password: {password}"
                )
            )
        else:
            self.stdout.write("Usuario 'admin' ya existe, no se modifica.")

        proveedor, _ = Proveedor.objects.get_or_create(
            nit="DEV-0001",
            defaults={
                "razon_social": "Proveedor Demo Guangzhou",
                "fabrica": "Fábrica Demo",
                "ciudad_origen": "Guangzhou",
            },
        )

        prenda, _ = Prenda.objects.get_or_create(
            codigo_modelo="DEV-VC-001",
            defaults={
                "nombre": "Vestido Casual Demo",
                "categoria": "Vestidos",
                "temporada": "Verano",
            },
        )
        for talla, color in [("S", "Rojo"), ("M", "Rojo"), ("L", "Rojo")]:
            VarianteProducto.objects.get_or_create(
                prenda=prenda,
                talla=talla,
                color=color,
                defaults={"precio_unitario": Decimal("120.00")},
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Datos de ejemplo listos: proveedor '{proveedor}' y prenda '{prenda}' con variantes."
            )
        )
