from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from apps.catalogo.models import Prenda, VarianteProducto
from apps.usuarios.models import Rol, Usuario
from apps.usuarios.permissions import Roles
from config.exceptions import ConflictError

from . import services


def _crear_usuario(username, rol_nombre, password="Clave-Segura123"):
    rol, _ = Rol.objects.get_or_create(nombre=rol_nombre)
    return Usuario.objects.create_user(username=username, password=password, rol=rol)


class InventarioServiceTests(TestCase):
    def setUp(self):
        prenda = Prenda.objects.create(codigo_modelo="VC-INV-1", nombre="Prenda Inventario")
        self.variante = VarianteProducto.objects.create(
            prenda=prenda, talla="M", color="Gris", precio_unitario=Decimal("40.00"), stock_disponible=5
        )

    def test_registrar_entrada_incrementa_stock(self):
        services.registrar_entrada(self.variante, 10, observacion="Compra")
        self.variante.refresh_from_db()
        self.assertEqual(self.variante.stock_disponible, 15)

    def test_registrar_salida_no_permite_stock_negativo(self):
        with self.assertRaises(ConflictError):
            services.registrar_salida(self.variante, 10)
        self.variante.refresh_from_db()
        self.assertEqual(self.variante.stock_disponible, 5)


class MovimientoInventarioApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.password = "Clave-Segura123"
        self.administrador = _crear_usuario("admin_inv", Roles.ADMINISTRADOR, self.password)
        self.cliente = _crear_usuario("cliente_inv", Roles.CLIENTE_MAYORISTA, self.password)
        prenda = Prenda.objects.create(codigo_modelo="VC-INV-2", nombre="Prenda Inventario API")
        self.variante = VarianteProducto.objects.create(
            prenda=prenda, talla="S", color="Rosado", precio_unitario=Decimal("30.00"), stock_disponible=5
        )

    def test_cliente_no_puede_registrar_movimientos(self):
        self.client.login(username="cliente_inv", password=self.password)
        response = self.client.post(
            "/api/v1/movimientos-inventario/entrada/",
            {"variante": self.variante.id, "cantidad": 5},
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_administrador_puede_ajustar_stock(self):
        self.client.login(username="admin_inv", password=self.password)
        response = self.client.post(
            "/api/v1/movimientos-inventario/ajuste/",
            {"variante": self.variante.id, "delta": -2, "observacion": "Merma"},
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.variante.refresh_from_db()
        self.assertEqual(self.variante.stock_disponible, 3)
