from django.db import IntegrityError, transaction
from django.test import TestCase
from rest_framework.test import APIClient

from apps.usuarios.models import Rol, Usuario
from apps.usuarios.permissions import Roles

from .models import ClienteMayorista, Proveedor


def _crear_usuario(username, rol_nombre, password="Clave-Segura123"):
    rol, _ = Rol.objects.get_or_create(nombre=rol_nombre)
    return Usuario.objects.create_user(username=username, password=password, rol=rol)


class ProveedorTests(TestCase):
    def test_nit_es_unico(self):
        Proveedor.objects.create(razon_social="Fábrica Uno", nit="123456", fabrica="F1")

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Proveedor.objects.create(razon_social="Fábrica Dos", nit="123456", fabrica="F2")


class ProveedorApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.password = "Clave-Segura123"
        self.operador = _crear_usuario("operador_prov", Roles.OPERADOR_COMERCIO_EXTERIOR, self.password)
        self.cliente = _crear_usuario("cliente_prov", Roles.CLIENTE_MAYORISTA, self.password)
        Proveedor.objects.create(razon_social="Fábrica Uno", nit="PROV-1")

    def test_operador_puede_consultar_proveedores(self):
        self.client.login(username="operador_prov", password=self.password)
        response = self.client.get("/api/v1/proveedores/")
        self.assertEqual(response.status_code, 200)

    def test_cliente_no_puede_consultar_proveedores(self):
        self.client.login(username="cliente_prov", password=self.password)
        response = self.client.get("/api/v1/proveedores/")
        self.assertEqual(response.status_code, 403)


class ProveedorValidacionApiTests(TestCase):
    """Checklist #1/#2/#3/#4 (docs/10-PLAN_VALIDACIONES.md, Sprint 6),
    aplicado vía `TerceroValidationMixin` a los 4 subtipos de Tercero —
    se prueba una sola vez sobre `Proveedor` porque la validación es
    idéntica en los cuatro serializers."""

    def setUp(self):
        self.client = APIClient()
        self.password = "Clave-Segura123"
        self.operador = _crear_usuario("operador_val", Roles.OPERADOR_COMERCIO_EXTERIOR, self.password)
        self.client.login(username="operador_val", password=self.password)

    def _crear_payload(self, **overrides):
        payload = {
            "razon_social": "Fábrica Válida",
            "nit": "123456789",
            "fabrica": "F1",
            "telefono": "70012345",
            "email": "Contacto@Fabrica.com",
        }
        payload.update(overrides)
        return payload

    def test_rechaza_razon_social_con_numeros(self):
        response = self.client.post("/api/v1/proveedores/", self._crear_payload(razon_social="Fabrica123"))
        self.assertEqual(response.status_code, 400)
        self.assertIn("razon_social", response.data)

    def test_normaliza_espacios_en_razon_social(self):
        response = self.client.post(
            "/api/v1/proveedores/", self._crear_payload(razon_social="  Fábrica   Uno  ")
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["razon_social"], "Fábrica Uno")

    def test_rechaza_nit_con_letras(self):
        response = self.client.post("/api/v1/proveedores/", self._crear_payload(nit="NIT-123"))
        self.assertEqual(response.status_code, 400)
        self.assertIn("nit", response.data)

    def test_normaliza_nit_con_espacios_y_guiones(self):
        response = self.client.post("/api/v1/proveedores/", self._crear_payload(nit="123 456-789"))
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["nit"], "123456789")

    def test_rechaza_nit_duplicado_tras_normalizar(self):
        Proveedor.objects.create(razon_social="Existente", nit="123456789")
        response = self.client.post("/api/v1/proveedores/", self._crear_payload(nit="123-456-789"))
        self.assertEqual(response.status_code, 400)
        self.assertIn("nit", response.data)

    def test_rechaza_telefono_con_letras(self):
        response = self.client.post("/api/v1/proveedores/", self._crear_payload(telefono="70A12345"))
        self.assertEqual(response.status_code, 400)
        self.assertIn("telefono", response.data)

    def test_guarda_email_en_minusculas(self):
        response = self.client.post("/api/v1/proveedores/", self._crear_payload())
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["email"], "contacto@fabrica.com")


class ClienteMayoristaApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.password = "Clave-Segura123"
        self.cliente_a = ClienteMayorista.objects.create(razon_social="Boutique A", nit="CLI-A")
        self.cliente_b = ClienteMayorista.objects.create(razon_social="Boutique B", nit="CLI-B")
        rol, _ = Rol.objects.get_or_create(nombre=Roles.CLIENTE_MAYORISTA)
        self.usuario_a = Usuario.objects.create_user(username="user_a", password=self.password, rol=rol)
        self.cliente_a.usuario = self.usuario_a
        self.cliente_a.save(update_fields=["usuario"])

    def test_cliente_consulta_su_propio_registro(self):
        self.client.login(username="user_a", password=self.password)
        response = self.client.get("/api/v1/clientes-mayoristas/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["nit"], "CLI-A")

    def test_cliente_no_puede_consultar_otro_cliente(self):
        self.client.login(username="user_a", password=self.password)
        response = self.client.get(f"/api/v1/clientes/{self.cliente_b.id}/")
        self.assertEqual(response.status_code, 404)
