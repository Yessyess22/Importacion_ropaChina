from decimal import Decimal

from django.db import IntegrityError, transaction
from django.test import TestCase
from rest_framework.test import APIClient

from apps.usuarios.models import Rol, Usuario
from apps.usuarios.permissions import Roles

from .models import Prenda, VarianteProducto


def _crear_usuario(username, rol_nombre, password="Clave-Segura123"):
    rol, _ = Rol.objects.get_or_create(nombre=rol_nombre)
    return Usuario.objects.create_user(username=username, password=password, rol=rol)


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


class PrendaApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.password = "Clave-Segura123"
        self.operador = _crear_usuario("operador_cat", Roles.OPERADOR_COMERCIO_EXTERIOR, self.password)
        self.cliente = _crear_usuario("cliente_cat", Roles.CLIENTE_MAYORISTA, self.password)
        self.prenda = Prenda.objects.create(codigo_modelo="VC-100", nombre="Vestido API")
        # BORRADOR por defecto: no debe ser visible para el Cliente Mayorista.
        VarianteProducto.objects.create(
            prenda=self.prenda, talla="M", color="Rojo", precio_unitario=Decimal("100.00")
        )

    def test_listar_prendas_requiere_autenticacion(self):
        response = self.client.get("/api/v1/prendas/")
        self.assertEqual(response.status_code, 401)

    def test_operador_puede_crear_prenda(self):
        self.client.login(username="operador_cat", password=self.password)
        response = self.client.post(
            "/api/v1/prendas/", {"codigo_modelo": "VC-101", "nombre": "Blusa API"}, format="json"
        )
        self.assertEqual(response.status_code, 201)

    def test_cliente_no_puede_crear_prenda(self):
        self.client.login(username="cliente_cat", password=self.password)
        response = self.client.post(
            "/api/v1/prendas/", {"codigo_modelo": "VC-102", "nombre": "Falda API"}, format="json"
        )
        self.assertEqual(response.status_code, 403)

    def test_codigo_modelo_duplicado_via_api_devuelve_400(self):
        self.client.login(username="operador_cat", password=self.password)
        response = self.client.post(
            "/api/v1/prendas/", {"codigo_modelo": "VC-100", "nombre": "Duplicado"}, format="json"
        )
        self.assertEqual(response.status_code, 400)

    def test_cliente_no_ve_variantes_en_borrador(self):
        self.client.login(username="cliente_cat", password=self.password)
        response = self.client.get("/api/v1/prendas/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 0)

    def test_cliente_no_ve_variante_borrador_anidada_en_prenda_visible(self):
        # La prenda ya tiene una variante BORRADOR (creada en setUp); le
        # agregamos una PUBLICADA con stock para que la prenda sí sea
        # visible, y verificamos que la variante en borrador no se filtre
        # dentro de `variantes` (Sprint 3 S3-T01).
        VarianteProducto.objects.create(
            prenda=self.prenda, talla="L", color="Azul",
            precio_unitario=Decimal("100.00"),
            estado=VarianteProducto.Estado.PUBLICADO, stock_disponible=5,
        )
        self.client.login(username="cliente_cat", password=self.password)
        response = self.client.get("/api/v1/prendas/")
        self.assertEqual(response.data["count"], 1)
        variantes = response.data["results"][0]["variantes"]
        self.assertEqual(len(variantes), 1)
        self.assertEqual(variantes[0]["color"], "Azul")

    def test_cliente_no_ve_prenda_con_variante_publicada_sin_stock(self):
        prenda_sin_stock = Prenda.objects.create(codigo_modelo="VC-101", nombre="Sin stock")
        VarianteProducto.objects.create(
            prenda=prenda_sin_stock, talla="S", color="Negro",
            precio_unitario=Decimal("50.00"),
            estado=VarianteProducto.Estado.PUBLICADO, stock_disponible=0,
        )
        self.client.login(username="cliente_cat", password=self.password)
        response = self.client.get("/api/v1/prendas/")
        codigos = [p["codigo_modelo"] for p in response.data["results"]]
        self.assertNotIn("VC-101", codigos)

    def test_filtro_por_talla_y_color_de_variantes(self):
        VarianteProducto.objects.create(
            prenda=self.prenda, talla="L", color="Azul", precio_unitario=Decimal("100.00")
        )
        otra_prenda = Prenda.objects.create(codigo_modelo="VC-102", nombre="Otra")
        VarianteProducto.objects.create(
            prenda=otra_prenda, talla="S", color="Verde", precio_unitario=Decimal("60.00")
        )

        self.client.login(username="operador_cat", password=self.password)
        response = self.client.get("/api/v1/prendas/?talla=L&color=Azul")
        self.assertEqual(response.status_code, 200)
        codigos = [p["codigo_modelo"] for p in response.data["results"]]
        self.assertEqual(codigos, ["VC-100"])

    def test_filtro_talla_y_color_exige_misma_variante(self):
        # `self.prenda` (VC-100) ya tiene M/Rojo (setUp) y ahora L/Azul: la
        # talla "M" y el color "Azul" existen en la prenda, pero en
        # variantes DISTINTAS. El filtro combinado no debe matchearla.
        VarianteProducto.objects.create(
            prenda=self.prenda, talla="L", color="Azul", precio_unitario=Decimal("100.00")
        )

        self.client.login(username="operador_cat", password=self.password)
        response = self.client.get("/api/v1/prendas/?talla=M&color=Azul")
        self.assertEqual(response.data["count"], 0)


class VarianteProductoApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.password = "Clave-Segura123"
        self.operador = _crear_usuario("operador_var", Roles.OPERADOR_COMERCIO_EXTERIOR, self.password)
        self.prenda = Prenda.objects.create(codigo_modelo="VC-200", nombre="Pantalón API")

    def test_crear_variante_valida(self):
        self.client.login(username="operador_var", password=self.password)
        response = self.client.post(
            "/api/v1/variantes/",
            {"prenda": self.prenda.id, "talla": "M", "color": "Negro", "precio_unitario": "80.00"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)

    def test_variante_duplicada_via_api_devuelve_400(self):
        VarianteProducto.objects.create(
            prenda=self.prenda, talla="S", color="Azul", precio_unitario=Decimal("80.00")
        )
        self.client.login(username="operador_var", password=self.password)
        response = self.client.post(
            "/api/v1/variantes/",
            {"prenda": self.prenda.id, "talla": "S", "color": "Azul", "precio_unitario": "85.00"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_publicar_variante(self):
        variante = VarianteProducto.objects.create(
            prenda=self.prenda, talla="L", color="Verde", precio_unitario=Decimal("80.00")
        )
        self.client.login(username="operador_var", password=self.password)
        response = self.client.post(f"/api/v1/variantes/{variante.id}/publicar/")
        self.assertEqual(response.status_code, 200)
        variante.refresh_from_db()
        self.assertEqual(variante.estado, VarianteProducto.Estado.PUBLICADO)
