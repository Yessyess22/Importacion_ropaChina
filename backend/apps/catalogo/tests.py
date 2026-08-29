from decimal import Decimal

from django.db import IntegrityError, transaction
from django.test import TestCase

from .models import Prenda, VarianteProducto


class PrendaVarianteProductoTests(TestCase):
    def setUp(self):
        self.prenda = Prenda.objects.create(
            codigo_modelo="VC-001",
            nombre="Vestido Casual",
        )

    def test_prenda_puede_tener_multiples_variantes(self):
        VarianteProducto.objects.create(
            prenda=self.prenda, talla="S", color="Rojo", precio_unitario=Decimal("120.00")
        )
        VarianteProducto.objects.create(
            prenda=self.prenda, talla="M", color="Rojo", precio_unitario=Decimal("120.00")
        )

        self.assertEqual(self.prenda.variantes.count(), 2)

    def test_variante_pertenece_a_una_prenda(self):
        variante = VarianteProducto.objects.create(
            prenda=self.prenda, talla="S", color="Negro", precio_unitario=Decimal("120.00")
        )

        self.assertEqual(variante.prenda, self.prenda)

    def test_codigo_modelo_es_unico(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Prenda.objects.create(codigo_modelo="VC-001", nombre="Duplicado")

    def test_precio_unitario_acepta_decimales(self):
        variante = VarianteProducto.objects.create(
            prenda=self.prenda, talla="L", color="Azul", precio_unitario=Decimal("99.90")
        )

        self.assertEqual(variante.precio_unitario, Decimal("99.90"))

    def test_no_permite_variante_duplicada_talla_color(self):
        VarianteProducto.objects.create(
            prenda=self.prenda, talla="S", color="Rojo", precio_unitario=Decimal("120.00")
        )

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                VarianteProducto.objects.create(
                    prenda=self.prenda, talla="S", color="Rojo", precio_unitario=Decimal("130.00")
                )
