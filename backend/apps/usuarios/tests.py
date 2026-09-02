from django.test import TestCase
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.test import APIClient, APIRequestFactory, force_authenticate
from rest_framework.views import APIView

from .models import Rol, Usuario
from .permissions import HasRole, Roles


class UsuarioRolTests(TestCase):
    def test_usuario_pertenece_a_un_rol(self):
        rol = Rol.objects.create(nombre="Administrador")
        usuario = Usuario.objects.create_user(username="admin1", password="temporal123", rol=rol)

        self.assertEqual(usuario.rol, rol)


def _crear_usuario(username, rol_nombre, password="Clave-Segura123", is_active=True):
    rol, _ = Rol.objects.get_or_create(nombre=rol_nombre)
    return Usuario.objects.create_user(username=username, password=password, rol=rol, is_active=is_active)


class LoginEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.password = "Clave-Segura123"
        self.usuario = _crear_usuario("cliente1", Roles.CLIENTE_MAYORISTA, self.password)

    def test_login_con_credenciales_validas(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": "cliente1", "password": self.password},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["user"]["username"], "cliente1")
        self.assertEqual(response.data["user"]["role"], Roles.CLIENTE_MAYORISTA)
        self.assertNotIn("password", response.data["user"])

    def test_login_con_password_incorrecta(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": "cliente1", "password": "incorrecta"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["detail"], "Credenciales inválidas.")

    def test_login_usuario_inexistente(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": "no-existe", "password": "cualquiera"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_login_usuario_inactivo(self):
        _crear_usuario("inactivo1", Roles.CLIENTE_MAYORISTA, "Clave-Segura123", is_active=False)
        response = self.client.post(
            "/api/auth/login/",
            {"username": "inactivo1", "password": "Clave-Segura123"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)


class UsuarioApiValidacionTests(TestCase):
    """Checklist #5 (docs/10-PLAN_VALIDACIONES.md, Sprint 6): contraseña
    fuerte y username mínimo en `UsuarioWriteSerializer`, ejercitados vía
    el endpoint real `/api/v1/usuarios/` (Solo Administrador)."""

    def setUp(self):
        self.client = APIClient()
        self.password = "Clave-Segura123"
        self.administrador = _crear_usuario("admin_val", Roles.ADMINISTRADOR, self.password)
        self.client.login(username="admin_val", password=self.password)

    def _payload(self, **overrides):
        payload = {"username": "nuevo_usuario", "email": "nuevo@trendy.test", "password": "Abcdef1!"}
        payload.update(overrides)
        return payload

    def test_crea_usuario_con_password_fuerte(self):
        response = self.client.post("/api/v1/usuarios/", self._payload())
        self.assertEqual(response.status_code, 201)

    def test_rechaza_password_sin_mayuscula(self):
        response = self.client.post("/api/v1/usuarios/", self._payload(password="abcdef1!"))
        self.assertEqual(response.status_code, 400)
        self.assertIn("password", response.data)

    def test_rechaza_password_sin_simbolo(self):
        response = self.client.post("/api/v1/usuarios/", self._payload(password="Abcdefg1"))
        self.assertEqual(response.status_code, 400)
        self.assertIn("password", response.data)

    def test_rechaza_password_muy_corta(self):
        response = self.client.post("/api/v1/usuarios/", self._payload(password="Ab1!"))
        self.assertEqual(response.status_code, 400)
        self.assertIn("password", response.data)

    def test_permite_password_en_blanco_al_crear(self):
        # Comportamiento intencional preexistente: sin password = cuenta con
        # password inutilizable hasta que se le asigne una.
        response = self.client.post("/api/v1/usuarios/", self._payload(password=""))
        self.assertEqual(response.status_code, 201)

    def test_rechaza_username_muy_corto(self):
        response = self.client.post("/api/v1/usuarios/", self._payload(username="ab"))
        self.assertEqual(response.status_code, 400)
        self.assertIn("username", response.data)

    def test_editar_sin_enviar_password_conserva_la_actual(self):
        creado = self.client.post("/api/v1/usuarios/", self._payload(username="editable"))
        self.assertEqual(creado.status_code, 201)
        usuario = Usuario.objects.get(username="editable")

        response = self.client.patch(f"/api/v1/usuarios/{usuario.id}/", {"first_name": "Ana"})
        self.assertEqual(response.status_code, 200)
        usuario.refresh_from_db()
        self.assertTrue(usuario.check_password("Abcdef1!"))

    def test_guarda_email_en_minusculas(self):
        response = self.client.post(
            "/api/v1/usuarios/",
            self._payload(username="conemailmayus", email="Nuevo.Usuario@Trendy.TEST"),
        )
        self.assertEqual(response.status_code, 201, response.data)
        usuario = Usuario.objects.get(username="conemailmayus")
        self.assertEqual(usuario.email, "nuevo.usuario@trendy.test")


class UsuarioViewSetPermisosTests(TestCase):
    """Regresión: `UsuarioViewSet` debe rechazar a cualquier rol que no
    sea Administrador tanto en lectura (`list`) como en escritura
    (`create`). El chequeo de rol vivía solo en `get_queryset()`, que
    `CreateModelMixin.create()` nunca invoca -- eso permitía que
    cualquier usuario autenticado se creara a sí mismo una cuenta de
    Administrador vía POST. Ver `views.py::UsuarioViewSet`."""

    def setUp(self):
        self.client = APIClient()
        self.password = "Clave-Segura123"
        self.cliente = _crear_usuario("cliente_priv", Roles.CLIENTE_MAYORISTA, self.password)
        self.operador = _crear_usuario("operador_priv", Roles.OPERADOR_COMERCIO_EXTERIOR, self.password)

    def _payload_admin(self):
        return {
            "username": "usuario_colado",
            "email": "colado@trendy.test",
            "password": "Abcdef1!",
            "rol": Roles.ADMINISTRADOR,
        }

    def test_cliente_mayorista_no_puede_crear_usuarios(self):
        self.client.login(username="cliente_priv", password=self.password)
        response = self.client.post("/api/v1/usuarios/", self._payload_admin())
        self.assertEqual(response.status_code, 403)
        self.assertFalse(Usuario.objects.filter(username="usuario_colado").exists())

    def test_operador_no_puede_crear_usuarios(self):
        self.client.login(username="operador_priv", password=self.password)
        response = self.client.post("/api/v1/usuarios/", self._payload_admin())
        self.assertEqual(response.status_code, 403)
        self.assertFalse(Usuario.objects.filter(username="usuario_colado").exists())

    def test_cliente_mayorista_no_puede_listar_usuarios(self):
        self.client.login(username="cliente_priv", password=self.password)
        response = self.client.get("/api/v1/usuarios/")
        self.assertEqual(response.status_code, 403)


class MeEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.password = "Clave-Segura123"
        self.usuario = _crear_usuario("admin2", Roles.ADMINISTRADOR, self.password)

    def test_me_requiere_autenticacion(self):
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, 401)

    def test_me_devuelve_usuario_autenticado(self):
        self.client.login(username="admin2", password=self.password)
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["username"], "admin2")
        self.assertEqual(response.data["role"], Roles.ADMINISTRADOR)
        self.assertNotIn("password", response.data)


class LogoutEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.password = "Clave-Segura123"
        self.usuario = _crear_usuario("op1", Roles.OPERADOR_COMERCIO_EXTERIOR, self.password)

    def test_logout_finaliza_la_sesion(self):
        self.client.login(username="op1", password=self.password)
        response = self.client.post("/api/auth/logout/")
        self.assertEqual(response.status_code, 204)

        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, 401)

    def test_logout_requiere_autenticacion(self):
        response = self.client.post("/api/auth/logout/")
        self.assertEqual(response.status_code, 401)


class _VistaSoloAdministrador(APIView):
    permission_classes = [IsAuthenticated, HasRole(Roles.ADMINISTRADOR)]

    def get(self, request):
        return Response(status=200)


class _VistaSoloContabilidad(APIView):
    permission_classes = [IsAuthenticated, HasRole(Roles.CONTABILIDAD)]

    def get(self, request):
        return Response(status=200)


class HasRolePermissionTests(TestCase):
    """Matriz de permisos de la Fase 3 (sección 33 del encargo): valida la
    fábrica `HasRole` con vistas de prueba que representan un módulo
    administrativo (equivalente a "Usuarios") y uno financiero (equivalente
    a "Costeo/Tributos"), ya que los endpoints de negocio reales se crean
    en la Fase 4 y en esta fase solo existen los de autenticación.
    """

    def setUp(self):
        self.factory = APIRequestFactory()
        self.administrador = _crear_usuario("adminx", Roles.ADMINISTRADOR)
        self.operador = _crear_usuario("operadorx", Roles.OPERADOR_COMERCIO_EXTERIOR)
        self.agente = _crear_usuario("agentex", Roles.AGENTE_ADUANAL)
        self.contador = _crear_usuario("contadorx", Roles.CONTABILIDAD)
        self.cliente = _crear_usuario("clientex", Roles.CLIENTE_MAYORISTA)

    def _status_for(self, view_cls, user):
        request = self.factory.get("/fake/")
        force_authenticate(request, user=user)
        response = view_cls.as_view()(request)
        return response.status_code

    def test_administrador_accede_a_modulo_administrativo(self):
        self.assertEqual(self._status_for(_VistaSoloAdministrador, self.administrador), 200)

    def test_operador_no_accede_a_modulo_administrativo(self):
        self.assertEqual(self._status_for(_VistaSoloAdministrador, self.operador), 403)

    def test_cliente_mayorista_no_accede_a_modulo_administrativo(self):
        self.assertEqual(self._status_for(_VistaSoloAdministrador, self.cliente), 403)

    def test_agente_aduanal_no_accede_a_informacion_financiera(self):
        self.assertEqual(self._status_for(_VistaSoloContabilidad, self.agente), 403)

    def test_contabilidad_accede_a_su_propio_modulo(self):
        self.assertEqual(self._status_for(_VistaSoloContabilidad, self.contador), 200)
