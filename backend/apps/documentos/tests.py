from decimal import Decimal

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient

from apps.importaciones.models import OperacionImportacion
from apps.terceros.models import Proveedor
from apps.usuarios.models import Rol, Usuario
from apps.usuarios.permissions import Roles

from .models import Documento
from .serializers import TAMANO_MAXIMO_BYTES


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

    def test_rechaza_extension_no_permitida(self):
        self.client.login(username="operador_doc", password=self.password)
        archivo = SimpleUploadedFile("script.exe", b"contenido", content_type="application/octet-stream")
        response = self.client.post(
            "/api/v1/documentos/",
            {
                "operacion": self.operacion.id,
                "tipo": Documento.Tipo.FACTURA,
                "archivo": archivo,
            },
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("archivo", response.data)

    def test_rechaza_archivo_demasiado_grande(self):
        self.client.login(username="operador_doc", password=self.password)
        archivo = SimpleUploadedFile(
            "factura.pdf", b"0" * (TAMANO_MAXIMO_BYTES + 1), content_type="application/pdf"
        )
        response = self.client.post(
            "/api/v1/documentos/",
            {
                "operacion": self.operacion.id,
                "tipo": Documento.Tipo.FACTURA,
                "archivo": archivo,
            },
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("archivo", response.data)

    def test_sanea_nombre_de_archivo_con_espacios(self):
        self.client.login(username="operador_doc", password=self.password)
        archivo = SimpleUploadedFile("factura final v2.pdf", b"contenido", content_type="application/pdf")
        response = self.client.post(
            "/api/v1/documentos/",
            {
                "operacion": self.operacion.id,
                "tipo": Documento.Tipo.FACTURA,
                "archivo": archivo,
            },
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertNotIn(" ", response.data["archivo"])

    def test_rechaza_fecha_emision_futura(self):
        self.client.login(username="operador_doc", password=self.password)
        response = self.client.post(
            "/api/v1/documentos/",
            {
                "operacion": self.operacion.id,
                "tipo": Documento.Tipo.FACTURA,
                "fecha_emision": "2099-01-01",
            },
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("fecha_emision", response.data)

    def test_acepta_pdf_valido(self):
        self.client.login(username="operador_doc", password=self.password)
        archivo = SimpleUploadedFile("factura.pdf", b"contenido", content_type="application/pdf")
        response = self.client.post(
            "/api/v1/documentos/",
            {
                "operacion": self.operacion.id,
                "tipo": Documento.Tipo.FACTURA,
                "archivo": archivo,
            },
        )
        self.assertEqual(response.status_code, 201, response.data)
