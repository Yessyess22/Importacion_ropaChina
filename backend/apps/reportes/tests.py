from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APIClient

from apps.importaciones.models import OperacionImportacion
from apps.pedidos.models import PedidoMayorista
from apps.terceros.models import ClienteMayorista, Proveedor
from apps.usuarios.models import Rol, Usuario
from apps.usuarios.permissions import Roles


class ReportesApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.password = "Clave-Segura123"
        rol_admin, _ = Rol.objects.get_or_create(nombre=Roles.ADMINISTRADOR)
        rol_cliente, _ = Rol.objects.get_or_create(nombre=Roles.CLIENTE_MAYORISTA)
        Usuario.objects.create_user(username="admin_rep", password=self.password, rol=rol_admin)
        Usuario.objects.create_user(username="cliente_rep", password=self.password, rol=rol_cliente)

    def test_administrador_puede_consultar_reporte_de_importaciones(self):
        self.client.login(username="admin_rep", password=self.password)
        response = self.client.get("/api/v1/reportes/importaciones/")
        self.assertEqual(response.status_code, 200)

    def test_cliente_no_puede_consultar_reportes(self):
        self.client.login(username="cliente_rep", password=self.password)
        response = self.client.get("/api/v1/reportes/importaciones/")
        self.assertEqual(response.status_code, 403)


class ReporteImportacionesAgregacionTests(TestCase):
    """GAP-5: cobertura de la agregación y el filtro de fechas de
    `ReporteImportacionesView`."""

    def setUp(self):
        self.client = APIClient()
        self.password = "Clave-Segura123"
        rol_admin, _ = Rol.objects.get_or_create(nombre=Roles.ADMINISTRADOR)
        Usuario.objects.create_user(username="admin_rep2", password=self.password, rol=rol_admin)
        self.client.login(username="admin_rep2", password=self.password)

        self.proveedor = Proveedor.objects.create(
            razon_social="Guangzhou Fashion Ltd.", nit="CN-1", pais="China"
        )

        self._crear_operacion("OP-2026-0001", "REGISTRADA", "2026-01-10", fob=1000, flete=100, seguro=50)
        self._crear_operacion("OP-2026-0002", "REGISTRADA", "2026-06-15", fob=2000, flete=200, seguro=100)
        self._crear_operacion("OP-2026-0003", "LIBERADA", "2026-03-01", fob=500, flete=50, seguro=25)

    def _crear_operacion(self, codigo, estado, fecha, fob, flete, seguro):
        cif = Decimal(fob) + Decimal(flete) + Decimal(seguro)
        return OperacionImportacion.objects.create(
            codigo_unico=codigo,
            proveedor=self.proveedor,
            fecha_registro=fecha,
            estado=estado,
            valor_fob=fob,
            valor_flete=flete,
            valor_seguro=seguro,
            valor_cif=cif,
        )

    def test_agrupa_por_estado_con_conteo_y_cif_total(self):
        response = self.client.get("/api/v1/reportes/importaciones/")

        self.assertEqual(response.status_code, 200)
        por_estado = {fila["estado"]: fila for fila in response.data["por_estado"]}

        self.assertEqual(por_estado["REGISTRADA"]["cantidad"], 2)
        self.assertEqual(Decimal(por_estado["REGISTRADA"]["total_cif"]), Decimal("3450.00"))
        self.assertEqual(por_estado["LIBERADA"]["cantidad"], 1)
        self.assertEqual(Decimal(por_estado["LIBERADA"]["total_cif"]), Decimal("575.00"))

    def test_filtro_fecha_desde_excluye_operaciones_anteriores(self):
        response = self.client.get("/api/v1/reportes/importaciones/?fecha_desde=2026-02-01")

        total_cantidad = sum(fila["cantidad"] for fila in response.data["por_estado"])
        self.assertEqual(total_cantidad, 2)

    def test_filtro_fecha_hasta_excluye_operaciones_posteriores(self):
        response = self.client.get("/api/v1/reportes/importaciones/?fecha_hasta=2026-02-01")

        total_cantidad = sum(fila["cantidad"] for fila in response.data["por_estado"])
        self.assertEqual(total_cantidad, 1)

    def test_rango_de_fechas_combinado(self):
        response = self.client.get(
            "/api/v1/reportes/importaciones/?fecha_desde=2026-02-01&fecha_hasta=2026-05-01"
        )

        total_cantidad = sum(fila["cantidad"] for fila in response.data["por_estado"])
        self.assertEqual(total_cantidad, 1)
        self.assertEqual(response.data["por_estado"][0]["estado"], "LIBERADA")


class ReportePedidosAgregacionTests(TestCase):
    """GAP-5: cobertura del filtro por cliente y la agregación de
    `ReportePedidosView`."""

    def setUp(self):
        self.client = APIClient()
        self.password = "Clave-Segura123"
        rol_admin, _ = Rol.objects.get_or_create(nombre=Roles.ADMINISTRADOR)
        Usuario.objects.create_user(username="admin_rep3", password=self.password, rol=rol_admin)
        self.client.login(username="admin_rep3", password=self.password)

        self.cliente_a = ClienteMayorista.objects.create(razon_social="Boutique Luna", nit="BO-1")
        self.cliente_b = ClienteMayorista.objects.create(razon_social="Tienda Sol", nit="BO-2")

        PedidoMayorista.objects.create(
            codigo_pedido="PED-0001", cliente=self.cliente_a, fecha="2026-01-01", estado="PENDIENTE"
        )
        PedidoMayorista.objects.create(
            codigo_pedido="PED-0002", cliente=self.cliente_a, fecha="2026-01-02", estado="CONFIRMADO"
        )
        PedidoMayorista.objects.create(
            codigo_pedido="PED-0003", cliente=self.cliente_b, fecha="2026-01-03", estado="PENDIENTE"
        )

    def test_agrupa_todos_los_pedidos_por_estado_sin_filtro(self):
        response = self.client.get("/api/v1/reportes/pedidos/")

        por_estado = {fila["estado"]: fila["cantidad"] for fila in response.data["por_estado"]}
        self.assertEqual(por_estado["PENDIENTE"], 2)
        self.assertEqual(por_estado["CONFIRMADO"], 1)

    def test_filtro_por_cliente_restringe_la_agregacion(self):
        response = self.client.get(f"/api/v1/reportes/pedidos/?cliente={self.cliente_b.pk}")

        por_estado = {fila["estado"]: fila["cantidad"] for fila in response.data["por_estado"]}
        self.assertEqual(por_estado, {"PENDIENTE": 1})
