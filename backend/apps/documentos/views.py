from rest_framework import viewsets
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated

from apps.importaciones.models import OperacionImportacion
from apps.usuarios.permissions import HasRole, Roles
from config.exceptions import ConflictError

from .models import Documento
from .serializers import DocumentoSerializer

GESTION_ROLES = (Roles.ADMINISTRADOR, Roles.OPERADOR_COMERCIO_EXTERIOR, Roles.AGENTE_ADUANAL)
LECTURA_ROLES = GESTION_ROLES + (Roles.CONTABILIDAD,)


class DocumentoViewSet(viewsets.ModelViewSet):
    """Documentos de una operación de importación (RF-06): factura, BL,
    packing list, certificado de origen. Información interna: el Cliente
    Mayorista no tiene acceso."""

    queryset = Documento.objects.select_related("operacion")
    serializer_class = DocumentoSerializer
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated, HasRole(*LECTURA_ROLES)]
    filterset_fields = ["operacion", "tipo"]
    search_fields = ["nombre", "operacion__codigo_unico"]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAuthenticated(), HasRole(*GESTION_ROLES)()]
        return super().get_permissions()

    def perform_destroy(self, instance):
        # Una vez liberada la operación, sus documentos son el respaldo
        # legal de la importación (sección 54): ya no se eliminan.
        if instance.operacion.estado == OperacionImportacion.Estado.LIBERADA:
            raise ConflictError(
                "No se puede eliminar un documento de una operación ya liberada."
            )
        instance.delete()
