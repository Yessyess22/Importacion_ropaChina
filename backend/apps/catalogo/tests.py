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
