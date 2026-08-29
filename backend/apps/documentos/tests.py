from decimal import Decimal

from django.test import TestCase

from apps.importaciones.models import OperacionImportacion
from apps.terceros.models import Proveedor

from .models import Documento


class DocumentoTests(TestCase):
    def setUp(self):
        proveedor = Proveedor.objects.create(razon_social="Fábrica Uno", nit="222")
        self.operacion = OperacionImportacion.objects.create(
            codigo_unico="OP-0001",
            proveedor=proveedor,
            fecha_registro="2026-08-01",
            valor_fob=Decimal("1000.00"),
            valor_flete=Decimal("100.00"),
            valor_seguro=Decimal("20.00"),
        )

    def test_operacion_puede_tener_multiples_documentos(self):
        Documento.objects.create(operacion=self.operacion, tipo=Documento.Tipo.FACTURA)
        Documento.objects.create(operacion=self.operacion, tipo=Documento.Tipo.BL)

        self.assertEqual(self.operacion.documentos.count(), 2)
