from rest_framework.authentication import SessionAuthentication as _SessionAuthentication


class SessionAuthentication(_SessionAuthentication):
    """Idéntica a la de DRF, pero expone `authenticate_header`.

    Sin esto, DRF degrada automáticamente una petición sin sesión de 401
    (no autenticado) a 403 (autenticado sin permiso), porque ningún
    autenticador ofrece un desafío `WWW-Authenticate` (ver
    `APIView.handle_exception`). El proyecto necesita distinguir 401/403
    (sección 36 del encargo de Fase 3).
    """

    def authenticate_header(self, request):
        return "Session"
