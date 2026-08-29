from decimal import Decimal

from django.db import IntegrityError, transaction
from django.test import TestCase

from .models import TipoCambio


class TipoCambioTests(TestCase):
    def test_registrar_tipo_de_cambio(self):
        tipo_cambio = TipoCambio.objects.create(fecha="2026-08-28", valor=Decimal("6.9600"))

        self.assertEqual(tipo_cambio.valor, Decimal("6.9600"))

    def test_no_permite_dos_registros_para_la_misma_fecha(self):
        TipoCambio.objects.create(fecha="2026-08-28", valor=Decimal("6.9600"))

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                TipoCambio.objects.create(fecha="2026-08-28", valor=Decimal("7.0000"))
