from decimal import Decimal

from django.db import IntegrityError, transaction
from django.test import TestCase

from apps.terceros.models import Proveedor

from .models import OperacionImportacion


class OperacionImportacionTests(TestCase):
    def setUp(self):
        self.proveedor = Proveedor.objects.create(
            razon_social="Fábrica Uno", nit="111", fabrica="F1"
        )

    def _crear_operacion(self, codigo_unico="OP-0001"):
        return OperacionImportacion.objects.create(
            codigo_unico=codigo_unico,
            proveedor=self.proveedor,
            fecha_registro="2026-08-01",
            valor_fob=Decimal("1000.00"),
            valor_flete=Decimal("100.00"),
            valor_seguro=Decimal("20.00"),
        )

    def test_proveedor_puede_tener_multiples_operaciones(self):
        self._crear_operacion("OP-0001")
        self._crear_operacion("OP-0002")

        self.assertEqual(self.proveedor.operaciones_importacion.count(), 2)

    def test_codigo_unico_es_unico(self):
        self._crear_operacion("OP-0001")

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                self._crear_operacion("OP-0001")

    def test_valores_monetarios_aceptan_decimales(self):
        operacion = self._crear_operacion("OP-0003")

        self.assertEqual(operacion.valor_fob, Decimal("1000.00"))
        self.assertEqual(operacion.valor_flete, Decimal("100.00"))
        self.assertEqual(operacion.valor_seguro, Decimal("20.00"))
