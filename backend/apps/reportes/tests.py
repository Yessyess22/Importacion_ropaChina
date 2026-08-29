from django.test import TestCase
from rest_framework.test import APIClient

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
