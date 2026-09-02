from decimal import Decimal

from django.db import IntegrityError, transaction
from django.test import TestCase
from rest_framework.test import APIClient

from apps.catalogo.models import Prenda, VarianteProducto
from apps.terceros.models import Proveedor
from apps.usuarios.models import Rol, Usuario
from apps.usuarios.permissions import Roles

from .models import DetalleImportacion, OperacionImportacion


def _crear_usuario(username, rol_nombre, password="Clave-Segura123"):
    rol, _ = Rol.objects.get_or_create(nombre=rol_nombre)
    return Usuario.objects.create_user(username=username, password=password, rol=rol)


class OperacionImportacionTests(TestCase):
    def setUp(self):
        self.proveedor = Proveedor.objects.create(razon_social="Fábrica Uno", nit="111", fabrica="F1")

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


class OperacionImportacionApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.password = "Clave-Segura123"
        self.operador = _crear_usuario("operador_imp", Roles.OPERADOR_COMERCIO_EXTERIOR, self.password)
        self.cliente = _crear_usuario("cliente_imp", Roles.CLIENTE_MAYORISTA, self.password)
        self.proveedor = Proveedor.objects.create(razon_social="Fábrica API", nit="API-001")

    def _crear_operacion(self, codigo):
        return OperacionImportacion.objects.create(
            codigo_unico=codigo,
            proveedor=self.proveedor,
            fecha_registro="2026-08-01",
            valor_fob=Decimal("1000.00"),
            valor_flete=Decimal("100.00"),
            valor_seguro=Decimal("20.00"),
            valor_cif=Decimal("1120.00"),
        )

    def test_operador_puede_crear_importacion_y_cif_se_calcula_en_backend(self):
        self.client.login(username="operador_imp", password=self.password)
        response = self.client.post(
            "/api/v1/importaciones/",
            {
                "codigo_unico": "OP-API-0001",
                "proveedor": self.proveedor.id,
                "fecha_registro": "2026-08-01",
                "valor_fob": "1000.00",
                "valor_flete": "200.00",
                "valor_seguro": "100.00",
                "valor_cif": "999999.00",  # debe ser ignorado por el backend
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(Decimal(response.data["valor_cif"]), Decimal("1300.00"))

    def test_rechaza_valor_fob_negativo(self):
        self.client.login(username="operador_imp", password=self.password)
        response = self.client.post(
            "/api/v1/importaciones/",
            {
                "codigo_unico": "OP-API-NEG",
                "proveedor": self.proveedor.id,
                "fecha_registro": "2026-08-01",
                "valor_fob": "-100.00",
                "valor_flete": "100.00",
                "valor_seguro": "20.00",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("valor_fob", response.data)

    def test_rechaza_fecha_registro_futura(self):
        self.client.login(username="operador_imp", password=self.password)
        response = self.client.post(
            "/api/v1/importaciones/",
            {
                "codigo_unico": "OP-API-FUTURA",
                "proveedor": self.proveedor.id,
                "fecha_registro": "2099-01-01",
                "valor_fob": "1000.00",
                "valor_flete": "100.00",
                "valor_seguro": "20.00",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("fecha_registro", response.data)

    def test_cliente_no_puede_crear_importacion(self):
        self.client.login(username="cliente_imp", password=self.password)
        response = self.client.post(
            "/api/v1/importaciones/",
            {
                "codigo_unico": "OP-API-0002",
                "proveedor": self.proveedor.id,
                "fecha_registro": "2026-08-01",
                "valor_fob": "1000.00",
                "valor_flete": "200.00",
                "valor_seguro": "100.00",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_cliente_no_puede_listar_importaciones(self):
        self.client.login(username="cliente_imp", password=self.password)
        response = self.client.get("/api/v1/importaciones/")
        self.assertEqual(response.status_code, 403)

    def test_transicion_de_estado_invalida_devuelve_409(self):
        operacion = self._crear_operacion("OP-API-0003")
        self.client.login(username="operador_imp", password=self.password)
        response = self.client.post(
            f"/api/v1/importaciones/{operacion.id}/actualizar-estado/",
            {"estado": "LIBERADA"},
            format="json",
        )
        self.assertEqual(response.status_code, 409)

    def test_liberar_importacion_genera_entrada_de_stock(self):
        prenda = Prenda.objects.create(codigo_modelo="VC-IMP-1", nombre="Prenda Importada")
        variante = VarianteProducto.objects.create(
            prenda=prenda, talla="M", color="Blanco", precio_unitario=Decimal("50.00")
        )
        operacion = self._crear_operacion("OP-API-0004")
        DetalleImportacion.objects.create(
            operacion=operacion, variante=variante, cantidad=10, costo_unitario_fob=Decimal("20.00")
        )

        self.client.login(username="operador_imp", password=self.password)
        for estado in ["EN_TRANSITO", "EN_ADUANA", "LIBERADA"]:
            response = self.client.post(
                f"/api/v1/importaciones/{operacion.id}/actualizar-estado/",
                {"estado": estado},
                format="json",
            )
            self.assertEqual(response.status_code, 200, response.data)

        variante.refresh_from_db()
        self.assertEqual(variante.stock_disponible, 10)

    def test_rechaza_costo_unitario_fob_cero(self):
        prenda = Prenda.objects.create(codigo_modelo="VC-IMP-2", nombre="Prenda Importada 2")
        variante = VarianteProducto.objects.create(
            prenda=prenda, talla="S", color="Negro", precio_unitario=Decimal("50.00")
        )
        operacion = self._crear_operacion("OP-API-0005")

        self.client.login(username="operador_imp", password=self.password)
        response = self.client.post(
            "/api/v1/detalles-importacion/",
            {
                "operacion": operacion.id,
                "variante": variante.id,
                "cantidad": 5,
                "costo_unitario_fob": "0.00",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("costo_unitario_fob", response.data)
