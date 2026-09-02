from decimal import Decimal

from django.db import IntegrityError, transaction
from django.test import TestCase
from rest_framework.test import APIClient

from apps.importaciones.models import OperacionImportacion
from apps.terceros.models import Proveedor
from apps.usuarios.models import Rol, Usuario
from apps.usuarios.permissions import Roles

from .models import Costeo, TipoCambio, Tributo


def _crear_usuario(username, rol_nombre, password="Clave-Segura123"):
    rol, _ = Rol.objects.get_or_create(nombre=rol_nombre)
    return Usuario.objects.create_user(username=username, password=password, rol=rol)


class TipoCambioTests(TestCase):
    def test_registrar_tipo_de_cambio(self):
        tipo_cambio = TipoCambio.objects.create(fecha="2026-08-28", valor=Decimal("6.9600"))

        self.assertEqual(tipo_cambio.valor, Decimal("6.9600"))

    def test_no_permite_dos_registros_para_la_misma_fecha(self):
        TipoCambio.objects.create(fecha="2026-08-28", valor=Decimal("6.9600"))

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                TipoCambio.objects.create(fecha="2026-08-28", valor=Decimal("7.0000"))


class TipoCambioApiValidacionTests(TestCase):
    """Checklist #6/#7 (docs/10-PLAN_VALIDACIONES.md, Sprint 7)."""

    def setUp(self):
        self.client = APIClient()
        self.password = "Clave-Segura123"
        self.administrador = _crear_usuario("admin_tc", Roles.ADMINISTRADOR, self.password)
        self.client.login(username="admin_tc", password=self.password)

    def test_rechaza_valor_cero(self):
        response = self.client.post(
            "/api/v1/tipo-cambio/", {"fecha": "2026-08-28", "valor": "0"}, format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("valor", response.data)

    def test_rechaza_fecha_futura(self):
        response = self.client.post(
            "/api/v1/tipo-cambio/", {"fecha": "2099-01-01", "valor": "6.96"}, format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("fecha", response.data)


class CosteoApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.password = "Clave-Segura123"
        self.administrador = _crear_usuario("admin_costeo", Roles.ADMINISTRADOR, self.password)
        self.cliente = _crear_usuario("cliente_costeo", Roles.CLIENTE_MAYORISTA, self.password)
        proveedor = Proveedor.objects.create(razon_social="Fábrica Costeo", nit="COST-1")
        self.operacion = OperacionImportacion.objects.create(
            codigo_unico="OP-COST-1",
            proveedor=proveedor,
            fecha_registro="2026-08-01",
            valor_fob=Decimal("1000.00"),
            valor_flete=Decimal("100.00"),
            valor_seguro=Decimal("20.00"),
            valor_cif=Decimal("1120.00"),
        )

    def test_cliente_no_puede_acceder_a_costeo(self):
        self.client.login(username="cliente_costeo", password=self.password)
        response = self.client.get("/api/v1/costeos/")
        self.assertEqual(response.status_code, 403)

    def test_rechaza_porcentaje_mayor_a_cien(self):
        costeo = Costeo.objects.create(operacion=self.operacion)
        self.client.login(username="admin_costeo", password=self.password)
        response = self.client.post(
            "/api/v1/tributos/",
            {
                "costeo": costeo.id,
                "tipo": Tributo.Tipo.ARANCEL,
                "base_imponible": "1120.00",
                "porcentaje": "150.00",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("porcentaje", response.data)

    def test_calcular_costeo_suma_cif_y_tributos(self):
        costeo = Costeo.objects.create(operacion=self.operacion)
        Tributo.objects.create(
            costeo=costeo,
            tipo=Tributo.Tipo.ARANCEL,
            base_imponible=Decimal("1120.00"),
            porcentaje=Decimal("10.00"),
            monto=Decimal("112.00"),
        )
        self.client.login(username="admin_costeo", password=self.password)
        response = self.client.post(f"/api/v1/importaciones/{self.operacion.id}/calcular-costeo/")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(Decimal(response.data["costo_total"]), Decimal("1232.00"))
