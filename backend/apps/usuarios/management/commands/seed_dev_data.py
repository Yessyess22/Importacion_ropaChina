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
        from apps.terceros.models import ClienteMayorista, Proveedor
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
                self.style.WARNING(f"Usuario de desarrollo creado -> username: admin / password: {password}")
            )
        else:
            self.stdout.write("Usuario 'admin' ya existe, no se modifica.")

        # Cuenta de prueba con rol Cliente Mayorista, usada por la suite E2E
        # de Playwright (`tests/auth.spec.ts`, escenario E4) para validar la
        # restricción de rutas por rol. La contraseña es fija a propósito:
        # es una cuenta de solo pruebas, sin privilegios, gateada por el
        # `settings.DEBUG` check al inicio de este comando.
        rol_cliente = Rol.objects.get(nombre="Cliente Mayorista")
        cliente_password = os.environ.get("DJANGO_DEV_CLIENTE_PASSWORD") or "TestPass123!"
        if not Usuario.objects.filter(username="cliente_test").exists():
            usuario_cliente = Usuario.objects.create_user(
                username="cliente_test",
                email="cliente_test@example.com",
                password=cliente_password,
                rol=rol_cliente,
            )
            self.stdout.write(
                self.style.WARNING(
                    f"Usuario de prueba creado -> username: cliente_test / password: {cliente_password}"
                )
            )
        else:
            usuario_cliente = Usuario.objects.get(username="cliente_test")
            self.stdout.write("Usuario 'cliente_test' ya existe, no se modifica.")

        ClienteMayorista.objects.get_or_create(
            nit="DEV-0002",
            defaults={
                "razon_social": "Cliente Demo Mayorista",
                "tipo_negocio": "Boutique",
                "pedido_minimo_modelo": 10,
                "usuario": usuario_cliente,
            },
        )

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
        # Publicamos una variante con stock para que el catálogo mayorista
        # (Sprint 3 S3-T01) tenga al menos un modelo visible de entrada.
        VarianteProducto.objects.filter(prenda=prenda, talla="L", color="Rojo").update(
            estado=VarianteProducto.Estado.PUBLICADO, stock_disponible=40
        )

        # Modelos adicionales para poblar el catálogo con categorías,
        # tallas, colores y estados variados (demo de filtros de S3-T01).
        catalogo_demo = [
            {
                "codigo_modelo": "DEV-CH-001",
                "nombre": "Chaqueta Denim Urbana",
                "categoria": "Chaquetas",
                "temporada": "Otoño",
                "variantes": [
                    ("S", "Azul", "45.00", "PUBLICADO", 15),
                    ("M", "Azul", "45.00", "PUBLICADO", 8),
                    ("L", "Negro", "48.00", "PUBLICADO", 0),
                ],
            },
            {
                "codigo_modelo": "DEV-PT-001",
                "nombre": "Jean Recto Juvenil",
                "categoria": "Pantalones",
                "temporada": "Todo el año",
                "variantes": [
                    ("S", "Azul", "38.00", "PUBLICADO", 22),
                    ("M", "Negro", "38.00", "PUBLICADO", 30),
                    ("L", "Azul", "38.00", "BORRADOR", 0),
                ],
            },
            {
                "codigo_modelo": "DEV-PL-001",
                "nombre": "Polera Oversize Streetwear",
                "categoria": "Poleras",
                "temporada": "Verano",
                "variantes": [
                    ("M", "Blanco", "25.00", "PUBLICADO", 50),
                    ("L", "Negro", "25.00", "PUBLICADO", 12),
                ],
            },
            {
                "codigo_modelo": "DEV-SD-001",
                "nombre": "Sudadera Hoodie Básica",
                "categoria": "Sudaderas",
                "temporada": "Invierno",
                "variantes": [
                    ("M", "Gris", "55.00", "PUBLICADO", 18),
                    ("L", "Verde", "55.00", "DESCONTINUADO", 0),
                ],
            },
        ]
        for datos in catalogo_demo:
            prenda_demo, _ = Prenda.objects.get_or_create(
                codigo_modelo=datos["codigo_modelo"],
                defaults={
                    "nombre": datos["nombre"],
                    "categoria": datos["categoria"],
                    "temporada": datos["temporada"],
                },
            )
            for talla, color, precio, estado, stock in datos["variantes"]:
                variante, _ = VarianteProducto.objects.get_or_create(
                    prenda=prenda_demo,
                    talla=talla,
                    color=color,
                    defaults={"precio_unitario": Decimal(precio)},
                )
                VarianteProducto.objects.filter(pk=variante.pk).update(estado=estado, stock_disponible=stock)

        self.stdout.write(
            self.style.SUCCESS(
                f"Datos de ejemplo listos: proveedor '{proveedor}' y catálogo demo con "
                f"{len(catalogo_demo) + 1} prendas."
            )
        )
