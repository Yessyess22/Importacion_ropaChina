from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from apps.importaciones.models import OperacionImportacion
from apps.terceros.models import Proveedor
from apps.usuarios.models import Rol, Usuario
from apps.usuarios.permissions import Roles

from .models import Documento


def _crear_usuario(username, rol_nombre, password="Clave-Segura123"):
    rol, _ = Rol.objects.get_or_create(nombre=rol_nombre)
    return Usuario.objects.create_user(username=username, password=password, rol=rol)


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


class DocumentoApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.password = "Clave-Segura123"
        self.operador = _crear_usuario("operador_doc", Roles.OPERADOR_COMERCIO_EXTERIOR, self.password)
        self.cliente = _crear_usuario("cliente_doc", Roles.CLIENTE_MAYORISTA, self.password)
        proveedor = Proveedor.objects.create(razon_social="Fábrica Doc", nit="DOC-1")
        self.operacion = OperacionImportacion.objects.create(
            codigo_unico="OP-DOC-1",
            proveedor=proveedor,
            fecha_registro="2026-08-01",
            valor_fob=Decimal("1000.00"),
            valor_flete=Decimal("100.00"),
            valor_seguro=Decimal("20.00"),
        )

    def test_cliente_no_puede_acceder_a_documentos(self):
        self.client.login(username="cliente_doc", password=self.password)
        response = self.client.get("/api/v1/documentos/")
        self.assertEqual(response.status_code, 403)

    def test_operador_puede_registrar_documento(self):
        self.client.login(username="operador_doc", password=self.password)
        response = self.client.post(
            "/api/v1/documentos/",
            {"operacion": self.operacion.id, "tipo": Documento.Tipo.FACTURA, "nombre": "Factura 1"},
        )
        self.assertEqual(response.status_code, 201, response.data)
