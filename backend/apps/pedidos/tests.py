from decimal import Decimal

from django.db import IntegrityError, transaction
from django.test import TestCase
from rest_framework.test import APIClient

from apps.catalogo.models import Prenda, VarianteProducto
from apps.terceros.models import ClienteMayorista
from apps.usuarios.models import Rol, Usuario
from apps.usuarios.permissions import Roles

from .models import DetallePedido, PedidoMayorista


def _crear_usuario(username, rol_nombre, password="Clave-Segura123"):
    rol, _ = Rol.objects.get_or_create(nombre=rol_nombre)
    return Usuario.objects.create_user(username=username, password=password, rol=rol)


def _crear_usuario_cliente(username, cliente, password="Clave-Segura123"):
    rol, _ = Rol.objects.get_or_create(nombre=Roles.CLIENTE_MAYORISTA)
    usuario = Usuario.objects.create_user(username=username, password=password, rol=rol)
    cliente.usuario = usuario
    cliente.save(update_fields=["usuario"])
    return usuario


class PedidoMayoristaTests(TestCase):
    def setUp(self):
        self.cliente = ClienteMayorista.objects.create(
            razon_social="Boutique Uno", nit="333", pedido_minimo_modelo=6
        )
        prenda = Prenda.objects.create(codigo_modelo="VC-002", nombre="Blusa")
        self.variante = VarianteProducto.objects.create(
            prenda=prenda, talla="M", color="Blanco", precio_unitario=Decimal("50.00")
        )

    def test_pedido_pertenece_a_un_cliente_mayorista(self):
        pedido = PedidoMayorista.objects.create(
            codigo_pedido="PED-0001", cliente=self.cliente, fecha="2026-08-28"
        )

        self.assertEqual(pedido.cliente, self.cliente)

    def test_pedido_tiene_multiples_detalles(self):
        pedido = PedidoMayorista.objects.create(
            codigo_pedido="PED-0002", cliente=self.cliente, fecha="2026-08-28"
        )
        DetallePedido.objects.create(
            pedido=pedido, variante=self.variante, cantidad=6, precio_unitario=Decimal("50.00")
        )

        self.assertEqual(pedido.detalles.count(), 1)

    def test_detalle_pertenece_a_una_variante(self):
        pedido = PedidoMayorista.objects.create(
            codigo_pedido="PED-0003", cliente=self.cliente, fecha="2026-08-28"
        )
        detalle = DetallePedido.objects.create(
            pedido=pedido, variante=self.variante, cantidad=6, precio_unitario=Decimal("50.00")
        )

        self.assertEqual(detalle.variante, self.variante)

    def test_codigo_pedido_es_unico(self):
        PedidoMayorista.objects.create(
            codigo_pedido="PED-0004", cliente=self.cliente, fecha="2026-08-28"
        )

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                PedidoMayorista.objects.create(
                    codigo_pedido="PED-0004", cliente=self.cliente, fecha="2026-08-28"
                )


class PedidoMayoristaApiTests(TestCase):
    """RF-15/RF-27: cantidad mínima por modelo y reserva atómica de stock."""

    def setUp(self):
        self.client = APIClient()
        self.password = "Clave-Segura123"
        self.cliente_a = ClienteMayorista.objects.create(
            razon_social="Boutique A", nit="API-A", pedido_minimo_modelo=6
        )
        self.cliente_b = ClienteMayorista.objects.create(
            razon_social="Boutique B", nit="API-B", pedido_minimo_modelo=1
        )
        _crear_usuario_cliente("cliente_a", self.cliente_a, self.password)
        self.administrador = _crear_usuario("admin_ped", Roles.ADMINISTRADOR, self.password)

        prenda = Prenda.objects.create(codigo_modelo="VC-PED-1", nombre="Blusa Pedido")
        self.variante = VarianteProducto.objects.create(
            prenda=prenda,
            talla="M",
            color="Blanco",
            precio_unitario=Decimal("50.00"),
            stock_disponible=10,
            estado=VarianteProducto.Estado.PUBLICADO,
        )

    def _crear_pedido(self, cantidad):
        return self.client.post(
            "/api/v1/pedidos/",
            {"detalles": [{"variante": self.variante.id, "cantidad": cantidad}]},
            format="json",
        )

    def test_cliente_puede_crear_pedido(self):
        self.client.login(username="cliente_a", password=self.password)
        response = self._crear_pedido(6)
        self.assertEqual(response.status_code, 201, response.data)
        self.variante.refresh_from_db()
        self.assertEqual(self.variante.stock_disponible, 4)

    def test_cliente_puede_consultar_sus_pedidos(self):
        self.client.login(username="cliente_a", password=self.password)
        self._crear_pedido(6)
        response = self.client.get("/api/v1/pedidos/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)

    def test_cliente_no_puede_consultar_pedidos_de_otro_cliente(self):
        self.client.login(username="cliente_a", password=self.password)
        self._crear_pedido(6)
        self.client.logout()

        _crear_usuario_cliente("cliente_b", self.cliente_b, self.password)
        self.client.login(username="cliente_b", password=self.password)
        response = self.client.get("/api/v1/pedidos/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 0)

    def test_stock_insuficiente_rechaza_pedido(self):
        self.client.login(username="cliente_a", password=self.password)
        response = self._crear_pedido(20)
        self.assertEqual(response.status_code, 409)
        self.variante.refresh_from_db()
        self.assertEqual(self.variante.stock_disponible, 10)

    def test_cantidad_minima_incumplida_rechaza_pedido(self):
        self.client.login(username="cliente_a", password=self.password)
        response = self._crear_pedido(3)
        self.assertEqual(response.status_code, 409)
        self.variante.refresh_from_db()
        self.assertEqual(self.variante.stock_disponible, 10)

    def test_administrador_ve_todos_los_pedidos(self):
        self.client.login(username="cliente_a", password=self.password)
        self._crear_pedido(6)
        self.client.logout()

        self.client.login(username="admin_ped", password=self.password)
        response = self.client.get("/api/v1/pedidos/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
