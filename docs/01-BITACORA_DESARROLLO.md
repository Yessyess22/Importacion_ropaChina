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
| 2026-08-30 | Oscar | `backend/apps/auditoria/tests.py`, `backend/conftest.py`, `backend/pytest.ini`, `tests/auth.spec.ts`, `playwright.config.ts` | **S1-T09 · S1-T10 completados:** 7 tests unitarios Django para `auditoria.registrar()` (creación, SET_NULL, GenericFK) — 7/7 PASSED; 4 escenarios E2E Playwright (login, credenciales inválidas, logout con AlertDialog, protección de ruta por rol) | `pytest apps/auditoria/ -v` → 7 passed in 3.20s |
| 2026-08-30 | Oscar | `docker-compose.yml` | **Fix healthcheck backend:** reemplaza `curl` (no disponible en `python:3.12-slim`) por `urllib.request` de la stdlib de Python; agrega `start_period: 15s`. Todos los contenedores arrancan sin errores | `docker compose up -d` → 4/4 healthy |
| 2026-08-30 | Oscar | `.env`, `.env.example`, `frontend/src/services/authService.ts`, `frontend/src/layouts/AuthLayout.tsx` | **Fix login 404 y mejora UI de AuthLayout:** `VITE_API_URL` corregido a `/api` (sin `/v1`). `authService` desacoplado de `VITE_API_URL` — usa `AUTH_BASE='/api/auth'` para evitar doble-prefijo con endpoints no versionados. Panel izquierdo de login rediseñado: `bg-zinc-950` con orbes decorativos, texto hero, feature list y 4 stats. Login funcional — sesión activa verificada en `/` | Login exitoso con `admin / AdminDesarrolloUPDS2026!`; Dashboard visible con sidebar y rol correcto |
| 2026-08-30 | Oscar | `backend/apps/usuarios/serializers.py`, `backend/apps/usuarios/views.py`, `frontend/src/pages/admin/Usuarios.tsx` | **S1-T05 (refinamiento) — CRUD completo de Usuarios con UI premium:** `UsuarioWriteSerializer` con `password` estrictamente `write_only` y encriptado via `make_password`; `rol` como `SlugRelatedField(slug_field="nombre")` para lookup por nombre de rol. `UsuarioViewSet` elevado de `ReadOnlyModelViewSet` a `ModelViewSet` con `get_serializer_class()` que despacha el serializer correcto según acción. `Usuarios.tsx` rediseñado: modal `sm:max-w-150` con grid de 2 columnas (username/rol · nombre/apellido · email · contraseña), badges de rol con paleta pastel por perfil, `AlertDialog` de confirmación antes de cambiar `is_active`, spinner en submit y toasts Sonner para éxito/error | `tsc --noEmit` — 0 errores; flujo POST/PATCH verificado manualmente contra API |
| 2026-08-30 | Oscar/Agente | `frontend/src/pages/terceros/ClientesMayoristas.tsx` | **S1-T07 (rediseño premium) — Rediseño completo y CRUD Premium de Clientes Mayoristas bajo la Ley de Consistencia Visual:** Action Bar Card `p-6 shadow-primary/5` con botón `transition-all duration-200` restringido a rol Administrador; Interactive Table con `hover:bg-secondary/40` y cabeceras `bg-muted/50 font-semibold`; columna Pedido Mínimo formateada como "Mín. X unid./modelo"; icono `Power` para toggle lógico; Dialog Shell `sm:max-w-150` con grid 2 columnas (`razon_social`/`nit` · `tipo_negocio` Select/`pedido_minimo_modelo` · `telefono` full-width · `email` full-width · `direccion` full-width); Select shadcn/ui para tipo de negocio (`Boutique`, `Tienda Física`, `Online`); payload sin `usuario`/`id`; foco `ring-primary`; AlertDialog con mensaje contextual de pedidos; toasts Sonner para éxito/error DRF | `tsc --noEmit` — 0 errores; flujos POST/PATCH validados manualmente contra backend |
| 2026-08-30 | Oscar/Agente | `frontend/src/pages/terceros/Proveedores.tsx` | **S1-T06 (rediseño premium) — Rediseño completo y CRUD Premium de Proveedores bajo la Ley de Consistencia Visual:** Action Bar Card con `p-6 shadow-primary/5` y botón `transition-all duration-200`; Interactive Table con `transition-colors hover:bg-secondary/40` en filas de datos y `bg-muted/50 font-semibold` en cabeceras; columna "Ciudad / País" combinada (`"Guangzhou, China"`); icono `Power` de lucide-react para toggle lógico de estado; Dialog Shell `sm:max-w-150` con grid 2 columnas (`razon_social`/`nit` · `fabrica`/`ciudad_origen` · `pais`/`telefono` · `email` full-width · `direccion` full-width); `ciudad_origen` marcado como requerido; `pais` inicializado en "China"; foco `ring-primary` en todos los inputs; AlertDialog con mensaje contextual de suspensión ("Esto afectará su visibilidad en nuevos registros"); toasts Sonner para éxito y errores DRF interceptados vía `extractErrorMessage` | `tsc --noEmit` — 0 errores; flujos POST/PATCH validados manualmente contra backend |
| 2026-08-30 | Oscar/Agente | `frontend/src/pages/terceros/ClientesMayoristas.tsx` | **S1-T07 (rediseño premium) completado:** Reemplazo de `datalist` nativo por `Select` controlado de shadcn/ui. Formulario modal `Dialog` `sm:max-w-150` con grid de 2 columnas (Razón Social/NIT · Tipo de negocio/Pedido Mínimo · Teléfono full-width · Email full-width · Dirección full-width). Control de permisos restrictivo `canWrite` exclusivo para 'Administrador'. Badges pastel por estado (emerald/rose), hover en filas `hover:bg-secondary/40`, cabeceras `bg-muted/50 font-semibold`, inputs con foco unificado `ring-primary`, icono `Power` para toggle lógico de estado, AlertDialog contextual ("Esto afectará su visibilidad para registrar nuevos pedidos"), payload sin campo `usuario`, toasts Sonner para éxito/error DRF interceptados vía `extractErrorMessage`. | `tsc --noEmit` exitoso — 0 errores; validación manual de creación (POST) y edición (PATCH) en navegador. |
| 2026-08-30 | Oscar/Agente | `frontend/src/pages/terceros/AgentesAduanales.tsx` | **S1-T08 (rediseño premium) — Cierre de Sprint 1:** Consistencia visual alineada a la Ley de UI/UX. Action Bar Card `p-6 shadow-primary/5` con botón `transition-all duration-200`; `canWrite` corregido a Admin + Operador (se elimina Agente Aduanal del acceso de escritura). Interactive Table con `hover:bg-secondary/40` y cabeceras `bg-muted/50 font-semibold`; columna **Contacto** de dos líneas (Teléfono + Email). Dialog Shell `sm:max-w-150` con grid 2 columnas (Razón Social/NIT · Registro Aduanero/Teléfono · Email full-width requerido · Dirección full-width opcional); asteriscos `text-destructive` via `<span>`; foco `ring-primary` en todos los inputs; icono `Power` para toggle; AlertDialog contextual: "Esto afectará su visibilidad en el registro de nuevas operaciones de importación"; toasts Sonner para éxito/error. **Sprint 1 finalizado al 100%.** | `tsc --noEmit` — 0 errores; flujos POST/PATCH validados manualmente contra backend. |
