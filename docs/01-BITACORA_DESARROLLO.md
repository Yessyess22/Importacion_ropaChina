# Bitácora de Desarrollo — Trendy Import SRL

Registro cronológico de hitos académicos. Cada entrada documenta qué se construyó, quién lo hizo y qué pruebas validaron el trabajo. El formato es inmutable: no se editan entradas pasadas, solo se agregan nuevas al final.

---

## Formato de registro

| Fecha | Autor | Componente / Archivo(s) | Hito alcanzado | Pruebas ejecutadas |
|-------|-------|-------------------------|----------------|--------------------|

---

## Fase 1 — Arquitectura Base

| Fecha | Autor | Componente / Archivo(s) | Hito alcanzado | Pruebas ejecutadas |
|-------|-------|-------------------------|----------------|--------------------|
| 2026-03-15 | Oscar | `docker-compose.yml`, `docker/`, `nginx/nginx.conf` | Estructura de contenedores Docker operativa (postgres, backend, frontend, nginx) | `docker compose up --build` sin errores; Nginx responde en `http://localhost/` |
| 2026-03-16 | Shirley | `backend/config/settings/`, `backend/manage.py` | Proyecto Django 5.2 inicializado y conectado a PostgreSQL 16 | `python manage.py check` sin errores |
| 2026-03-17 | Oscar | `frontend/`, `vite.config.ts`, `tailwind.config.*` | Proyecto React 19 + TypeScript + Vite + Tailwind CSS v4 configurado | `npm run dev` sin errores; página de bienvenida en `http://localhost/` |

---

## Fase 2 — Modelado e Integridad de Base de Datos

| Fecha | Autor | Componente / Archivo(s) | Hito alcanzado | Pruebas ejecutadas |
|-------|-------|-------------------------|----------------|--------------------|
| 2026-04-01 | Shirley | `apps/usuarios/models.py` | Modelos `Rol` y `Usuario` (AbstractUser) con FK protegida | `makemigrations` + `migrate` exitosos |
| 2026-04-03 | Oscar | `apps/terceros/models.py` | Clase abstracta `Tercero` + subclases `Proveedor`, `ClienteMayorista`, `AgenteAduanal`, `Transportista` | Test de integridad referencial: intentar borrar proveedor con importación activa → `PROTECT` funciona |
| 2026-04-05 | Shirley | `apps/catalogo/models.py` | Modelos `Prenda` + `VarianteProducto` con constraint único talla/color | Tests de unicidad de variante |
| 2026-04-08 | Oscar | `apps/importaciones/models.py` | `OperacionImportacion` + `DetalleImportacion` con valor_cif persistido | Migración aplicada; FK PROTECT sobre Proveedor/Agente/Transportista verificada |
| 2026-04-10 | Shirley | `apps/costeo/models.py`, `apps/documentos/models.py` | `Costeo`, `Tributo`, `TipoCambio`, `Documento` | Migración aplicada |
| 2026-04-12 | Oscar | `apps/inventario/models.py`, `apps/pedidos/models.py`, `apps/auditoria/models.py` | `MovimientoInventario`, `PedidoMayorista`, `DetallePedido`, `Bitacora` con GenericFK | Todas las migraciones aplicadas; `showmigrations` en verde |
| 2026-04-14 | Shirley | `apps/usuarios/management/commands/seed_dev_data.py` | Comando de semilla de datos (roles, admin, ejemplos) operativo | `python manage.py seed_dev_data` con `DJANGO_DEBUG=True` |

---

## Fase 3 — Autenticación y Control de Acceso

| Fecha | Autor | Componente / Archivo(s) | Hito alcanzado | Pruebas ejecutadas |
|-------|-------|-------------------------|----------------|--------------------|
| 2026-05-05 | Oscar | `apps/usuarios/authentication.py`, `apps/usuarios/views.py` | `LoginView`, `LogoutView`, `MeView` con SessionAuthentication + CSRF | Tests de login válido, login inválido, logout, 401 vs 403 |
| 2026-05-07 | Shirley | `apps/usuarios/permissions.py` | Fábrica `HasRole` + clase `Roles` con los 5 perfiles | Tests de denegación de acceso por rol en endpoints protegidos |
| 2026-05-09 | Oscar | `frontend/src/context/AuthContext.tsx`, `frontend/src/services/authService.ts` | Contexto global de sesión; `me()` en mount; login/logout reactivos | Prueba manual: login → `/` protegida; logout → redirige a `/login` |
| 2026-05-10 | Shirley | `frontend/src/components/ProtectedRoute.tsx`, `frontend/src/App.tsx` | Rutas protegidas por rol; `ModulePlaceholder` para módulos futuros | Prueba manual: rol Agente no accede a `/costeo`; redirige a `/` |
| 2026-05-11 | Oscar | `frontend/src/services/api.ts` | Cliente HTTP centralizado con `credentials: 'include'` y `X-CSRFToken` automático | Prueba manual: PATCH a endpoint protegido con cookie válida → 200 |

---

## Fase 4 — API REST de Negocio

| Fecha | Autor | Componente / Archivo(s) | Hito alcanzado | Pruebas ejecutadas |
|-------|-------|-------------------------|----------------|--------------------|
| 2026-06-02 | Shirley | `apps/terceros/views.py`, `apps/terceros/serializers.py` | CRUD completo de Proveedor, ClienteMayorista, AgenteAduanal, Transportista | `terceros/tests.py` (65 líneas) — todos en verde |
| 2026-06-04 | Oscar | `apps/catalogo/views.py`, `apps/catalogo/serializers.py` | CRUD de Prenda/Variante + acción `publicar` + filtro de catálogo mayorista | `catalogo/tests.py` (146 líneas) — todos en verde |
| 2026-06-08 | Shirley | `apps/importaciones/services.py`, `apps/importaciones/views.py` | CIF calculado en backend; máquina de estados de aduana; entrada de stock al liberar | `importaciones/tests.py` (145 líneas) — todos en verde |
| 2026-06-10 | Oscar | `apps/costeo/services.py`, `apps/costeo/views.py` | Cálculo de tributos y costeo total; `calcular-costeo` como acción explícita | `costeo/tests.py` (68 líneas) — todos en verde |
| 2026-06-12 | Shirley | `apps/inventario/services.py`, `apps/inventario/views.py` | `select_for_update` en `_aplicar_movimiento`; acciones `entrada/salida/ajuste` | `inventario/tests.py` (67 líneas) — stock negativo rechazado |
| 2026-06-15 | Oscar | `apps/pedidos/services.py`, `apps/pedidos/views.py` | Pedido con validación de mínimo por modelo + reserva atómica de stock | `pedidos/tests.py` (156 líneas) — todos en verde |
| 2026-06-17 | Shirley | `apps/documentos/views.py`, `apps/reportes/views.py` | CRUD de Documentos; reportes de importaciones/pedidos con filtros de fecha | `documentos/tests.py` (65 líneas), `reportes/tests.py` (25 líneas) |
| 2026-06-18 | Oscar | `apps/auditoria/services.py` | Servicio de bitácora activo; llamado desde importaciones y pedidos | Verificación manual: crear importación → registro en `Bitacora` |
| 2026-06-19 | Shirley | `docs/api.md`, `docs/authentication.md`, `docs/08-AUDITORIA_CODIGO.md` | **Cierre de Fase 4 — API REST estable y documentada** | Colección Postman ejecutada sin errores; OpenAPI sin warnings |

---

## Fase 5 — Frontend de Negocio y Pruebas E2E *(En curso)*

| Fecha | Autor | Componente / Archivo(s) | Hito alcanzado | Pruebas ejecutadas |
|-------|-------|-------------------------|----------------|--------------------|
| 2026-08-30 | Oscar | `docs/` (01 al 08), `docker-compose.yml`, `.env.example`, `.gitignore`, `README.md` | **Puesta a punto de infraestructura y gobernanza documental — Inicio de Fase 5** | Revisión de archivos creados; docker-compose validado con `docker compose config` |
| 2026-08-30 | Oscar | `frontend/src/components/ui/` (10 componentes shadcn/ui), `frontend/src/utils/formatters.ts`, `frontend/src/layouts/AuthLayout.tsx`, `frontend/src/layouts/AppLayout.tsx`, `frontend/src/pages/Login.tsx` (refactor), `frontend/src/App.tsx` (rutas anidadas) | **S1-T01 · S1-T02 · S1-T03 · S1-T04 completados:** instalación de componentes shadcn/ui (`table`, `dialog`, `input`, `label`, `select`, `badge`, `card`, `skeleton`, `sonner`, `alert-dialog`), `formatters.ts` en español/BOB, `AuthLayout` B2B de dos columnas, `AppLayout` con sidebar responsivo y nav filtrada por rol, refactor de `Login.tsx` con Sonner toast, enrutamiento anidado bajo `AppLayout` con `ProtectedRoute` doble capa | `tsc --noEmit` — 0 errores; `npm run lint` — 0 errores propios (3 warnings en código generado por shadcn) |
| 2026-08-30 | Oscar | `backend/apps/usuarios/serializers.py`, `backend/apps/usuarios/views.py`, `backend/apps/usuarios/urls_v1.py`, `backend/config/urls_v1.py`, `backend/apps/terceros/urls.py`, `frontend/src/services/api.ts`, `frontend/src/types/`, `frontend/src/pages/admin/Usuarios.tsx`, `frontend/src/pages/terceros/Proveedores.tsx`, `frontend/src/pages/terceros/ClientesMayoristas.tsx`, `frontend/src/pages/terceros/AgentesAduanales.tsx` | **S1-T05 · S1-T06 · S1-T07 · S1-T08 completados:** endpoint `/api/v1/usuarios/` (ReadOnly, Admin only), fix URL `/api/v1/clientes-mayoristas/`, mejora de extracción de errores DRF en `api.ts`, 4 vistas CRUD con tabla paginada, búsqueda, modal Dialog de alta/edición y AlertDialog de confirmación para toggle activo | `tsc --noEmit` — 0 errores |
