from decimal import Decimal

from django.db import IntegrityError, transaction
from django.test import TestCase

from apps.catalogo.models import Prenda, VarianteProducto
from apps.terceros.models import ClienteMayorista

from .models import DetallePedido, PedidoMayorista


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
