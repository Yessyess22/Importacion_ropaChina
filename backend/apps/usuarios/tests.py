from django.test import TestCase

from .models import Rol, Usuario


class UsuarioRolTests(TestCase):
    def test_usuario_pertenece_a_un_rol(self):
        rol = Rol.objects.create(nombre="Administrador")
        usuario = Usuario.objects.create_user(username="admin1", password="temporal123", rol=rol)

        self.assertEqual(usuario.rol, rol)
