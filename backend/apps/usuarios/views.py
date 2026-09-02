from django.contrib.auth import authenticate
from django.contrib.auth import login as django_login
from django.contrib.auth import logout as django_logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import Usuario
from .permissions import HasRole, Roles
from .serializers import LoginSerializer, UsuarioListSerializer, UsuarioMeSerializer, UsuarioWriteSerializer


class LoginView(APIView):
    """POST /api/auth/login/

    Autentica por sesión (cookie HttpOnly de Django). No exige token CSRF:
    en este punto todavía no existe una sesión autenticada, así que
    SessionAuthentication no la exige (ver docs/authentication.md). Nunca
    devuelve la contraseña ni su hash.

    `throttle_scope = "login"` (checklist #12): limita intentos de fuerza
    bruta con la tasa `DEFAULT_THROTTLE_RATES["login"]` de `settings/base.py`,
    independiente del límite general de `AnonRateThrottle`.
    """

    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            request,
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )
        if user is None:
            return Response({"detail": "Credenciales inválidas."}, status=status.HTTP_400_BAD_REQUEST)

        django_login(request, user)
        return Response({"user": UsuarioMeSerializer(user).data})


class LogoutView(APIView):
    """POST /api/auth/logout/

    Requiere sesión activa y el header `X-CSRFToken` con el valor de la
    cookie `csrftoken` (obtenida previamente al consultar /api/auth/me/).
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        django_logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class MeView(APIView):
    """GET /api/auth/me/

    Usuario autenticado actual (sin contraseña/hash/tokens). Decorada con
    `ensure_csrf_cookie` en `dispatch` (no en `get`) para que la cookie
    `csrftoken` se fije también cuando la petición es anónima y `IsAuthenticated`
    la rechaza con 401 antes de llegar al método `get`: así el frontend
    obtiene la cookie en el primer chequeo de sesión al cargar la app, sin
    necesitar un endpoint dedicado solo para eso.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UsuarioMeSerializer(request.user).data)


class UsuarioViewSet(viewsets.ModelViewSet):
    """CRUD /api/v1/usuarios/ — gestión de usuarios del sistema.

    Solo el Administrador puede leer y escribir en este endpoint.
    Las contraseñas se hashean en el serializer; nunca se exponen en lecturas.

    El permiso se declara explícitamente en `permission_classes` (no solo
    dentro de `get_queryset`): `CreateModelMixin.create()` nunca llama a
    `get_queryset()` al no operar sobre un objeto existente, así que un
    chequeo de rol que viviera únicamente ahí jamás se ejecutaría en
    `POST` — cualquier usuario autenticado, sin importar su rol, habría
    podido crearse una cuenta de Administrador.
    """

    permission_classes = [IsAuthenticated, HasRole(Roles.ADMINISTRADOR)]
    search_fields = ["username", "first_name", "last_name", "email"]
    ordering_fields = ["username", "last_name"]

    def get_queryset(self):
        return Usuario.objects.select_related("rol").order_by("username")

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return UsuarioWriteSerializer
        return UsuarioListSerializer
