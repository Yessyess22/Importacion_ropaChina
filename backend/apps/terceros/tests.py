from django.db import IntegrityError, transaction
from django.test import TestCase

from .models import Proveedor


class ProveedorTests(TestCase):
    def test_nit_es_unico(self):
        Proveedor.objects.create(razon_social="Fábrica Uno", nit="123456", fabrica="F1")

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Proveedor.objects.create(razon_social="Fábrica Dos", nit="123456", fabrica="F2")
