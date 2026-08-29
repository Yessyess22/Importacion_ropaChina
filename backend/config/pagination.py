from rest_framework.pagination import PageNumberPagination


class StandardResultsSetPagination(PageNumberPagination):
    """Paginación por defecto de toda la API v1 (sección 31 del encargo).

    `page_size` es configurable por el cliente (hasta `max_page_size`) para
    permitir listas más chicas en widgets embebidos del frontend, sin
    exponer volcados masivos de datos por defecto.
    """

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100
