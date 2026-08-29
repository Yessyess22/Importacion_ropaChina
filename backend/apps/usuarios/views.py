from django.contrib.auth import authenticate
from django.contrib.auth import login as django_login
from django.contrib.auth import logout as django_logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import LoginSerializer, UsuarioMeSerializer


class LoginView(APIView):
    """POST /api/auth/login/

    Autentica por sesión (cookie HttpOnly de Django). No exige token CSRF:
    en este punto todavía no existe una sesión autenticada, así que
    SessionAuthentication no la exige (ver docs/authentication.md). Nunca
    devuelve la contraseña ni su hash.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            request,
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )
        if user is None:
            return Response(
                {"detail": "Credenciales inválidas."}, status=status.HTTP_400_BAD_REQUEST
            )

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
