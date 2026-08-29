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
        response = self.client.get("/api/v1/clientes/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["nit"], "CLI-A")

    def test_cliente_no_puede_consultar_otro_cliente(self):
        self.client.login(username="user_a", password=self.password)
        response = self.client.get(f"/api/v1/clientes/{self.cliente_b.id}/")
        self.assertEqual(response.status_code, 404)
