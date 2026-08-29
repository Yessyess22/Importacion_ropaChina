# API REST (Fase 4)

Esta fase agrega la API de negocio sobre el esquema de datos de la Fase 2
([docs/database.md](database.md)) y la autenticación de la Fase 3
([docs/authentication.md](authentication.md)), sin modificar ninguna de
las dos. Todo lo de negocio vive bajo `/api/v1/`; `/api/auth/` (login,
logout, `me`) sigue igual.

## 1. Autenticación y CSRF

La API de negocio usa **la misma sesión de Django** que `/api/auth/`
(cookie `sessionid`, `HttpOnly`). No hay un segundo mecanismo de
autenticación ni tokens. Para cualquier `POST`/`PATCH`/`DELETE` hay que
enviar el header `X-CSRFToken` con el valor de la cookie `csrftoken` (ver
[authentication.md](authentication.md), sección 6). El cliente HTTP del
frontend (`frontend/src/services/api.ts`) ya lo hace automáticamente.

Como la autenticación es por cookie de sesión (no un *bearer token*), el
botón "Authorize" de Swagger UI (`/api/docs/`) no aplica: para probar
manualmente hay que loguearse primero (`POST /api/auth/login/`) y que el
cliente (navegador, Postman, `curl -b/-c`) reenvíe la cookie.

## 2. Documentación interactiva

| Ruta | Contenido |
|---|---|
| `/api/schema/` | Schema OpenAPI 3 (YAML), generado con `drf-spectacular`. |
| `/api/docs/` | Swagger UI sobre ese schema. |

Se genera automáticamente a partir de los serializers/viewsets: no se
mantiene documentación manual de cada endpoint. Las vistas de
autenticación (`LoginView`/`LogoutView`/`MeView`, Fase 3) no declaran
`serializer_class` explícito y por eso no aparecen con detalle en el
schema; no se tocaron para no reabrir código de una fase ya cerrada.

## 3. Versionado

Todo el negocio vive bajo `/api/v1/` (prefijo de URL simple, sin
`DEFAULT_VERSIONING_CLASS` de DRF: no hace falta esa complejidad todavía).
Cada app agrega su propio router en `apps/<app>/urls.py`;
`config/urls_v1.py` solo los agrega bajo el prefijo. Introducir
`/api/v2/` en el futuro no requiere tocar las apps existentes.

## 4. Endpoints

| Recurso | Rutas | Roles con acceso |
|---|---|---|
| Prendas | `GET/POST /prendas/`, `GET/PATCH /prendas/{id}/` | Lectura: todos (catálogo filtrado para Cliente Mayorista). Escritura: Administrador, Operador |
| Variantes | `GET/POST /variantes/`, `GET/PATCH /variantes/{id}/`, `POST /variantes/{id}/publicar/` | Igual que Prendas |
| Proveedores | CRUD `/proveedores/` | Administrador, Operador, Agente Aduanal, Contabilidad (no Cliente) |
| Clientes mayoristas | CRUD `/clientes/` | Staff: todo. Cliente Mayorista: solo lectura de su propio registro |
| Agentes aduanales | CRUD `/agentes-aduanales/` | Staff (no Cliente) |
| Transportistas | CRUD `/transportistas/` | Staff (no Cliente) |
| Importaciones | `GET/POST/PATCH /importaciones/`, `POST /importaciones/{id}/actualizar-estado/`, `POST /importaciones/{id}/calcular-costeo/` | Lectura: Administrador, Operador, Agente Aduanal, Contabilidad. Escritura: Administrador, Operador. Estado: + Agente Aduanal. Costeo: Administrador, Contabilidad. Sin DELETE (histórico) |
| Detalles de importación | CRUD `/detalles-importacion/?operacion=<id>` | Igual que Importaciones |
| Documentos | CRUD `/documentos/?operacion=<id>` (multipart) | Administrador, Operador, Agente Aduanal (+ lectura Contabilidad). No Cliente |
| Costeos | Solo lectura `/costeos/?operacion=<id>` | Administrador, Contabilidad, Operador (lectura) |
| Tributos | CRUD `/tributos/?costeo=<id>` | Lectura: + Operador. Escritura: Administrador, Contabilidad |
| Tipo de cambio | CRUD `/tipo-cambio/` | Lectura: Administrador, Contabilidad, Operador. Escritura: Administrador, Contabilidad |
| Movimientos de inventario | Solo lectura `/movimientos-inventario/`, `POST .../entrada/`, `.../salida/`, `.../ajuste/` | Lectura: Administrador, Operador, Contabilidad, Agente Aduanal. Entrada/salida: Administrador, Operador. Ajuste: solo Administrador |
| Pedidos | `GET/POST /pedidos/`, `POST /pedidos/{id}/actualizar-estado/` | Cliente Mayorista: solo los propios. Administrador/Operador: todos. Contabilidad: lectura. Sin PATCH/DELETE (histórico) |
| Detalles de pedido | Solo lectura `/detalles-pedido/?pedido=<id>` | Igual que Pedidos |
| Reportes | `GET /reportes/importaciones/`, `GET /reportes/pedidos/` | Administrador, Operador, Contabilidad |

Todas las rutas de negocio exigen `IsAuthenticated` + el rol correspondiente
(`apps.usuarios.permissions.HasRole`, Fase 3, sin cambios).

## 5. Filtros, búsqueda, orden y paginación

- Filtros por campo (`django-filter`): p. ej. `?estado=EN_ADUANA`,
  `?categoria=vestido`, `?operacion=12`.
- Búsqueda de texto: `?search=...` sobre los campos declarados en cada
  vista (`codigo_modelo`, `nombre`, `nit`, `codigo_unico`, etc.).
- Orden: `?ordering=fecha` / `?ordering=-fecha` sobre una lista blanca de
  campos por vista (`ordering_fields`).
- Paginación: `PageNumberPagination`, 20 resultados por página por
  defecto, `?page=2`, `?page_size=50` (máximo 100). Toda lista responde
  `{"count", "next", "previous", "results"}`.

## 6. Reglas de negocio que el backend nunca delega al frontend

- **CIF** (`apps/importaciones/services.py::calcular_cif`): siempre
  `valor_fob + valor_flete + valor_seguro`, recalculado en cada
  creación/edición. `valor_cif` es de solo lectura en el serializer; un
  `valor_cif` enviado por el cliente se ignora.
- **Monto de tributo** (`apps/costeo/services.py::calcular_monto_tributo`):
  `base_imponible * porcentaje / 100`. Es la única fórmula de tributos que
  el proyecto tiene confirmada; quien registra el tributo ingresa la base
  imponible (el proyecto no tiene definida una fórmula en cascada
  arancel→IVA, así que no se asume una).
- **Costo total de nacionalización**
  (`apps/costeo/services.py::calcular_costeo`): `valor_cif` + suma de
  `Tributo.monto` del costeo, recalculado por
  `POST /importaciones/{id}/calcular-costeo/`.
- **Cantidad mínima por modelo** (RF-15,
  `apps/pedidos/services.py::crear_pedido`): se agrupan las líneas del
  pedido por `Prenda` y se compara contra
  `ClienteMayorista.pedido_minimo_modelo`. Si algún modelo no llega al
  mínimo, se rechaza el pedido completo con `409`.
- **Reserva de stock** (RF-27, mismo servicio): crear un pedido descuenta
  `VarianteProducto.stock_disponible` de inmediato (vía
  `apps/inventario/services.py`, con `select_for_update` +
  `transaction.atomic()`), dejando el pedido en `PENDIENTE`. Es la
  interpretación más simple posible dado que el esquema de la Fase 2 no
  tiene un campo `stock_reservado` separado: "reservar" = "descontar ya".
  Si el pedido se cancela (`actualizar-estado` → `CANCELADO`), el stock se
  devuelve. Nunca queda stock negativo: si no alcanza, se rechaza todo el
  pedido con `409` (sin reservas parciales).
- **Precio histórico** (RF-25): `DetallePedido.precio_unitario` se copia
  de `VarianteProducto.precio_unitario` en el momento de crear el pedido,
  nunca se recalcula con el precio vigente.
- **Stock nunca se edita a mano**: `VarianteProducto.stock_disponible` es
  de solo lectura en su serializer. El único punto de escritura es
  `apps/inventario/services.py` (usado por creación de pedidos, cambio de
  estado de importación/pedido, y las acciones manuales
  `entrada`/`salida`/`ajuste`).

## 7. Transiciones de estado válidas

**`OperacionImportacion`** (`apps/importaciones/services.py`):
`REGISTRADA → EN_TRANSITO → EN_ADUANA → LIBERADA`, con `CANCELADA`
disponible desde cualquier estado anterior a `LIBERADA`. Al llegar a
`LIBERADA` se genera automáticamente una entrada de inventario por cada
`DetalleImportacion` de la operación (RF-08/RF-09). Una transición fuera
de esa tabla responde `409`.

**`PedidoMayorista`** (`apps/pedidos/services.py`):
`PENDIENTE → CONFIRMADO → EN_PREPARACION → ENVIADO → ENTREGADO`, con
`CANCELADO` disponible hasta antes de `ENVIADO`. Cancelar devuelve el
stock reservado. RF-16 ("notificar estado del pedido") no incluye un
canal de notificación real (correo/websocket) en esta fase: no hay
infraestructura de envío de correo en el proyecto todavía; el cambio de
estado sí queda en la bitácora.

## 8. Información interna protegida del Cliente Mayorista

Proveedores, importaciones, documentos, costeo, tributos, tipo de cambio
y movimientos de inventario son inaccesibles para el rol Cliente
Mayorista (`403`), tal como pide el encargo. El catálogo (`/prendas/`,
`/variantes/`) sí es visible para ese rol, pero filtrado a
`Prenda.activo=True` y `VarianteProducto.estado=PUBLICADO`.

## 9. Auditoría

`apps/auditoria/services.py::registrar(usuario, accion, entidad, detalle)`
es el único punto de escritura de `Bitacora`. Se llama explícitamente
desde los servicios de dominio en las operaciones críticas: crear/cambiar
estado de una importación, crear/cambiar estado de un pedido. No hay
señales ni middleware automático (se prefirió dejar explícito en el
código de negocio qué se audita). No se expone un endpoint de lectura de
bitácora en esta fase (no estaba en el alcance acordado); se consulta
desde Django Admin (ya de solo lectura desde la Fase 2).

## 10. Manejo de errores

- `401`: sin sesión.
- `403`: autenticado pero sin el rol requerido, o CSRF faltante/inválido.
- `400`: datos inválidos (incluye duplicados de campos `unique=True` o de
  `UniqueConstraint`, que DRF valida automáticamente).
- `409`: conflicto con el estado actual del recurso (transición de estado
  no permitida, stock insuficiente, cantidad mínima incumplida, o intento
  de borrar un registro referenciado por otros vía `on_delete=PROTECT`).
- `404`: recurso inexistente o fuera del alcance del usuario (p. ej. un
  Cliente Mayorista pidiendo el detalle de otro cliente).

`config/exceptions.py` centraliza `ConflictError` (409) y el
`EXCEPTION_HANDLER` que traduce `ProtectedError` de Django a un 409 en
vez de un 500 con traceback.

## 11. Decisiones explícitamente diferidas (documentadas, no implementadas)

- **Throttling/rate limiting** (sección 48 del encargo): no se configuró
  en esta fase. El proyecto no tiene todavía un backend de cache
  compartido (Redis) que lo justifique; se deja para cuando haya un
  entorno de producción real.
- **Notificaciones de estado de pedido** (RF-16): solo se registra el
  cambio de estado (bitácora); el envío real (correo, push) requiere
  infraestructura que no existe aún.
- **Fórmula de tributos en cascada** (arancel sobre CIF, IVA sobre
  CIF+arancel, etc.): no está confirmada por el proyecto; se implementó
  solo el porcentaje simple (`base_imponible * porcentaje / 100`) y quien
  registra el tributo decide la base imponible.
- **Bitácora de solo lectura vía API**: no se expuso endpoint REST; se
  usa Django Admin (ya existente).

## 12. Cómo probar

```bash
docker compose exec backend python manage.py test apps
```

Colección de Postman: [`docs/postman/trendy-import.postman_collection.json`](postman/trendy-import.postman_collection.json).
