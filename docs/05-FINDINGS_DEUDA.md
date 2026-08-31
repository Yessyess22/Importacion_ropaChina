# Registro de Deuda Técnica — Trendy Import SRL

> Registro vivo de brechas de implementación, bugs conocidos y mejoras pendientes detectadas durante la revisión de código o el trabajo de sprint. Cada ítem tiene un propietario y un sprint objetivo de resolución.

**Última actualización:** 2026-08-30 (post-auditoría de Fase 4)
**Fuente de la auditoría:** [`docs/08-AUDITORIA_CODIGO.md`](08-AUDITORIA_CODIGO.md)

---

## Deuda Crítica (bloquea entrega o funcionalidad principal)

### GAP-1 — Vistas de negocio del frontend son placeholders vacíos

| Campo | Valor |
|-------|-------|
| **Severidad** | 🔴 Crítico |
| **Detectado** | 2026-08-30 |
| **Sprint objetivo** | Sprints 1, 2 y 3 |
| **Propietario** | Shirley + Oscar |
| **Estado** | 🟡 Parcial — Sprints 1 y 2 resueltos, Sprint 3 pendiente |

**Descripción:** Todas las rutas del frontend excepto `/login` y `/` (dashboard mínimo) renderizan un componente `ModulePlaceholder` sin lógica de consumo de API. El backend tiene una API REST completa y funcional, pero no existe ninguna pantalla de negocio construida para: Catálogo, Importaciones, Pedidos, Costeo, Inventario, Reportes ni Bitácora.

**Progreso Sprint 1 (resuelto):**
- ✅ `/usuarios` — CRUD completo: tabla paginada, modal alta/edición (grid 2 col), AlertDialog toggle estado, toasts. Backend: `UsuarioWriteSerializer` + `ModelViewSet`.
- ✅ `/proveedores` — CRUD completo con AlertDialog.
- ✅ `/clientes-mayoristas` — CRUD completo.
- ✅ `/agentes-aduanales` — CRUD completo.

**Progreso Sprint 2 (resuelto):**
- ✅ `/importaciones` (S2-T01) — DataTable con filtros de estado/proveedor y búsqueda.
- ✅ `/importaciones/nueva` (S2-T02) — formulario de registro con CIF previsualizado + líneas de detalle.
- ✅ `/importaciones/:id` (S2-T03) — detalle, líneas de variantes ingresadas, modal de cambio de estado.
- ✅ `/documentos` (S2-T04) — selector de operación, upload multipart, descarga y eliminación.
- ✅ `/costeo` (S2-T05) — selector de operación, formulario de tributos, cálculo de costo total nacionalizado.
- ✅ `/tipo-cambio` (S2-T06) — CRUD completo (no existía ni la ruta ni el ítem de sidebar antes de esta tarea).

**Pendiente (Sprint 3):**
- Catálogo y Pedidos (`/catalogo`, `/pedidos`) — ver `04-SPRINTS.md`.
- `/stock`, `/reportes`, `/auditoria` quedan para Sprint 3/4 según planificación.

---

### GAP-2 — Layout Shell ausente (bloquea toda la Fase 5)

| Campo | Valor |
|-------|-------|
| **Severidad** | 🔴 Bloqueante |
| **Detectado** | 2026-08-30 |
| **Sprint objetivo** | Sprint 1 — Tarea S1-T02 |
| **Propietario** | Oscar |
| **Estado** | ✅ Resuelto (2026-08-30) |

**Descripción:** El directorio `frontend/src/layouts/` contenía solo un archivo `.gitkeep`. No existía `AppLayout` ni `AuthLayout`.

**Resolución aplicada:**
- `frontend/src/layouts/AppLayout.tsx` — sidebar fijo en desktop, hamburguesa en mobile, nav filtrada por rol desde `AuthContext`, header con nombre/rol, logout con `AlertDialog`. Usa `<Outlet />` para rutas anidadas.
- `frontend/src/layouts/AuthLayout.tsx` — layout B2B de dos columnas (panel de marca + formulario centrado).
- `frontend/src/App.tsx` — rutas anidadas bajo `AppLayout` con doble capa `ProtectedRoute`.

---

## Deuda Media (afecta calidad o experiencia sin bloquear flujo principal)

### GAP-3 — shadcn/ui incompleto en el frontend

| Campo | Valor |
|-------|-------|
| **Severidad** | 🟡 Medio |
| **Detectado** | 2026-08-30 |
| **Sprint objetivo** | Sprint 1 — Tarea S1-T01 |
| **Propietario** | Shirley |
| **Estado** | ✅ Resuelto (2026-08-30) |

**Descripción:** Solo el componente `Button` de shadcn/ui estaba instalado.

**Resolución aplicada:** Instalados vía `npx shadcn add --yes`: `table`, `input`, `label`, `select`, `badge`, `card`, `skeleton`, `sonner`, `dialog`, `alert-dialog`. El componente `form` no está disponible en el registro `base-nova` de shadcn v4 — se usan `Input` + `Label` nativos. Paquete `sonner ^2.0.8` añadido a `package.json`. Se corrigió `sonner.tsx` para eliminar dependencia de `next-themes` (incompatible con Vite standalone).

---

### GAP-4 — Tests de `auditoria` sin cobertura real

| Campo | Valor |
|-------|-------|
| **Severidad** | 🟡 Medio |
| **Detectado** | 2026-08-30 |
| **Sprint objetivo** | Sprint 1 — Tarea S1-T10 |
| **Propietario** | Oscar |
| **Estado** | ✅ Resuelto (2026-08-30) |

**Resolución aplicada:** `backend/apps/auditoria/tests.py` reescrito con 3 clases `TestCase` y 7 tests: creación correcta de registro, invariante SET_NULL (usuario FK queda NULL pero `usuario_repr` persiste), y resolución de `GenericForeignKey` via ContentTypes. `backend/pytest.ini` + `backend/conftest.py` añadidos para soporte `pytest-django`. Resultado: **7/7 PASSED en 3.20s**.

---

### GAP-5 — Tests de `reportes` mínimos

| Campo | Valor |
|-------|-------|
| **Severidad** | 🟢 Bajo |
| **Detectado** | 2026-08-30 |
| **Sprint objetivo** | Sprint 4 — Tarea S4-T06 |
| **Propietario** | Shirley |
| **Estado** | 🔴 Abierto |

**Descripción:** `backend/apps/reportes/tests.py` tiene 25 líneas. Los tests probablemente solo verifican que los endpoints responden 200. Faltan tests para:
- Filtro `fecha_desde` / `fecha_hasta` en `ReporteImportacionesView`.
- Filtro por `cliente` en `ReportePedidosView`.
- Correctitud de la agregación `Sum(valor_cif)` y `Count(id)` por estado.

---

### GAP-6 — Subida de archivos (Documento) sin implementar en frontend

| Campo | Valor |
|-------|-------|
| **Severidad** | 🟡 Medio |
| **Detectado** | 2026-08-30 |
| **Sprint objetivo** | Sprint 2 — Tarea S2-T04 |
| **Propietario** | Shirley |
| **Estado** | ✅ Resuelto (2026-08-30) |

**Descripción original:** El modelo `Documento.archivo` tiene un `FileField` declarado y migrado. La API de documentos existía en el backend, pero el frontend no implementaba la carga multipart de archivos. Tampoco se había probado que el backend procesara correctamente un `FormData` con archivo adjunto.

**Resolución aplicada:** `frontend/src/pages/documentos/Documentos.tsx` (selector de operación, formulario multipart, tabla con descarga/eliminación). Al probar el upload real aparecieron **dos bugs de infraestructura que esta tarea dejaba sin verificar y que de hecho rompían la subida por completo**:
1. `MEDIA_ROOT`/`STATIC_ROOT` en `backend/config/settings/base.py` usaban `BASE_DIR.parent` en vez de `BASE_DIR`, escribiendo los archivos fuera de `/app/media` (el volumen Docker compartido con Nginx). Corregido.
2. `nginx.conf` no tenía `location /media/` — cualquier descarga caía en el catch-all que proxea al frontend (404). Se agregó `location /media/ { alias /app/media/; }` junto con `client_max_body_size 20M;`.

Verificado end-to-end: `curl -I http://localhost/media/.../archivo.pdf` → `200 OK`.

---

## Deuda Estructural (no urgente, mejora a futuro)

### GAP-7 — Carpeta `tests/` raíz vacía

| Campo | Valor |
|-------|-------|
| **Severidad** | 🟢 Bajo |
| **Sprint objetivo** | Sprint 1 — Tarea S1-T09 |
| **Estado** | ✅ Resuelto (2026-08-30) |

**Resolución aplicada:** `tests/auth.spec.ts` creado con 4 escenarios Playwright (login exitoso, credenciales inválidas + Toast Sonner, logout con `AlertDialog`, protección de ruta por rol). `playwright.config.ts` en raíz con `baseURL: http://localhost` y Chromium como motor. Comando de ejecución: `npx playwright test tests/auth.spec.ts` con stack Docker activo.

**Nota (2026-08-30, Sprint 2):** esta resolución quedó incompleta — no incluía `package.json` en la raíz, así que la suite **nunca pudo ejecutarse realmente** desde una instalación limpia (`@playwright/test` no estaba declarado en ningún lado), ni el escenario E4 pasaba (`seed_dev_data` no creaba el usuario `cliente_test` que ese test asume). Ver GAP-11 y GAP-12, ambos ya resueltos.

---

### GAP-8 — Documentos de gobernanza incompletos en `docs/`

| Campo | Valor |
|-------|-------|
| **Severidad** | 🟢 Bajo |
| **Sprint objetivo** | Sprint 1 (completado al generar esta documentación) |
| **Estado** | ✅ Resuelto (2026-08-30) |

**Descripción:** Los archivos `01-BITACORA_DESARROLLO.md`, `02-SESSION_MEM.md`, `05-FINDINGS_DEUDA.md` y `06-TASK_PLAN.md` referenciados en el protocolo de trabajo no existían. Generados como parte de la puesta a punto de Fase 5.

---

### GAP-9 — `pytest` no instalado en el contenedor backend

| Campo | Valor |
|-------|-------|
| **Severidad** | 🟡 Medio |
| **Detectado** | 2026-08-30 (Sprint 2, verificación previa a S2-T03) |
| **Sprint objetivo** | Sin asignar |
| **Propietario** | Sin asignar |
| **Estado** | 🔴 Abierto |

**Descripción:** `pytest` no figura en `backend/requirements.txt` y el ejecutable no existe en el contenedor (`docker compose exec backend pytest` → `executable file not found`), a pesar de que `docs/01-BITACORA_DESARROLLO.md` (Fase 5, S1-T09/T10) registra `pytest apps/auditoria/ -v → 7 passed`. Además, `apps/auditoria/tests.py` importa `pytest` directamente, por lo que `python manage.py test apps` falla con `ModuleNotFoundError: No module named 'pytest'` en vez de correr esos tests. Es decir: la suite de auditoría no es ejecutable hoy con ninguno de los dos comandos documentados en `08-CONTROL_SESION.md`. No se investigó ni corrigió en esta sesión por estar fuera del alcance de S2-T01/S2-T03; requiere decidir si se agrega `pytest`/`pytest-django` a `requirements.txt` y se reconstruye la imagen, o se reescribe `auditoria/tests.py` sobre `django.test.TestCase` para consistencia con el resto de apps.

---

### GAP-10 — Test de `terceros` falla en `main` (preexistente)

| Campo | Valor |
|-------|-------|
| **Severidad** | 🟢 Bajo |
| **Sprint objetivo** | Sin asignar |
| **Propietario** | Sin asignar |
| **Estado** | 🔴 Abierto |

**Descripción:** `apps.terceros.tests.ClienteMayoristaApiTests.test_cliente_consulta_su_propio_registro` falla con `404 != 200`. Confirmado con `git stash` que la falla existe también en `main` sin los cambios de Sprint 2 (S2-T01/S2-T03) — no es una regresión introducida en esta sesión. Pendiente de investigar si es un problema de URL (`/clientes-mayoristas/{id}/` vs. lookup por usuario) o de datos de prueba.

---

### GAP-11 — No existía `package.json` en la raíz del repositorio

| Campo | Valor |
|-------|-------|
| **Severidad** | 🔴 Crítico (bloqueaba toda la suite E2E) |
| **Detectado** | 2026-08-30 (Sprint 2, al preparar S2-T07) |
| **Propietario** | Shirley |
| **Estado** | ✅ Resuelto (2026-08-30) |

**Descripción:** `playwright.config.ts` y `tests/auth.spec.ts` existían y estaban documentados como "PASSED" desde Sprint 1, pero no había ningún `package.json` en la raíz del repo declarando `@playwright/test` como dependencia — `npx playwright test` fallaba con `Cannot find module '@playwright/test'` en cualquier instalación limpia (npx solo resolvía una copia cacheada globalmente por ejecuciones interactivas previas, no reproducible). Es decir, la suite E2E nunca pudo haberse ejecutado tal como está documentada desde un checkout nuevo.

**Resolución aplicada:** `package.json` creado en la raíz con `@playwright/test` como devDependency y script `test:e2e`. `npm install` ejecutado — genera `package-lock.json` (commiteado para reproducibilidad).

---

### GAP-12 — `seed_dev_data` no crea el usuario de prueba que la suite E2E asume

| Campo | Valor |
|-------|-------|
| **Severidad** | 🟡 Medio |
| **Detectado** | 2026-08-30 (Sprint 2, primera ejecución real de `tests/auth.spec.ts` tras resolver GAP-11) |
| **Propietario** | Shirley |
| **Estado** | ✅ Resuelto (2026-08-30) |

**Descripción:** `tests/auth.spec.ts` (escenario E4) asume una cuenta `cliente_test / TestPass123!` con rol Cliente Mayorista. `seed_dev_data` solo creaba el usuario `admin`. Al correr la suite por primera vez de forma reproducible (ver GAP-11), E4 falló por timeout: el login nunca redirige porque las credenciales no existen.

**Resolución aplicada:** `backend/apps/usuarios/management/commands/seed_dev_data.py` ahora crea también `cliente_test` (rol Cliente Mayorista) y un `ClienteMayorista` vinculado (`nit=DEV-0002`). Contraseña fija a propósito por ser una cuenta de solo pruebas sin privilegios, configurable vía `DJANGO_DEV_CLIENTE_PASSWORD` si se necesita cambiar.

---

### GAP-13 — `MEDIA_ROOT`/`STATIC_ROOT` mal calculados (`BASE_DIR.parent`)

| Campo | Valor |
|-------|-------|
| **Severidad** | 🔴 Crítico (los archivos subidos no persistían ni eran accesibles) |
| **Detectado** | 2026-08-30 (Sprint 2, al verificar la descarga de un documento subido en S2-T04) |
| **Propietario** | Shirley |
| **Estado** | ✅ Resuelto (2026-08-30) |

**Descripción:** En `backend/config/settings/base.py`, `BASE_DIR = Path(__file__).resolve().parent.parent.parent` ya resuelve a `/app` (raíz del contenedor backend). `MEDIA_ROOT`/`STATIC_ROOT` usaban `BASE_DIR.parent` (`/`), es decir escribían en `/media` y `/staticfiles` en la raíz del *filesystem* del contenedor — fuera del volumen `media_volume` montado en `/app/media` (compartido de solo lectura con Nginx) y sin persistencia entre reconstrucciones. El síntoma: un `Documento` se guardaba correctamente en la base de datos con una URL válida, pero el archivo físico no existía donde Nginx lo buscaba (404) ni en ningún volumen persistente.

**Resolución aplicada:** `MEDIA_ROOT = BASE_DIR / "media"`, `STATIC_ROOT = BASE_DIR / "staticfiles"`. Ver también GAP-6 (fix de `nginx.conf` relacionado).

---

## Historial de Deuda Resuelta

| Fecha resolución | ID | Descripción | Resuelto por |
|-----------------|----|-------------|-------------|
| 2026-08-30 | GAP-8 | Documentos de gobernanza creados | Oscar |
| 2026-08-30 | GAP-2 | `AppLayout.tsx` y `AuthLayout.tsx` creados; rutas anidadas con `Outlet` en `App.tsx` | Oscar |
| 2026-08-30 | GAP-3 | 10 componentes shadcn/ui instalados + corrección de `sonner.tsx` para Vite | Oscar |
| 2026-08-30 | GAP-4 | 7 tests unitarios para `auditoria.registrar()` — 7/7 PASSED (`pytest apps/auditoria/`) | Oscar |
| 2026-08-30 | GAP-7 | `tests/auth.spec.ts` con 4 escenarios E2E Playwright + `playwright.config.ts` | Oscar |
| 2026-08-30 | — | Fix healthcheck Docker: `curl` → `urllib.request` en `docker-compose.yml` (`python:3.12-slim` no incluye curl) | Oscar |
| 2026-08-30 | — | Fix login 404: `VITE_API_URL` corregido a `/api`; `authService` usa `AUTH_BASE='/api/auth'` (no depende de env var) | Oscar |
| 2026-08-30 | — | `DetalleImportacionNestedSerializer` sin `variante_detalle` — el detalle de importación no mostraba talla/color de las líneas | Shirley |
| 2026-08-30 | — | `Select` de shadcn/base-ui mostraba el `value` crudo en vez del label del ítem seleccionado (afectaba filtros de `Importaciones.tsx` y el selector de operación/tipo de tributo en `Costeo.tsx`) — corregido con `children` como función en `SelectValue` | Shirley |
| 2026-08-30 | GAP-6 | Upload de documentos implementado en frontend; fixes de `MEDIA_ROOT`/`nginx.conf` que lo bloqueaban por completo | Shirley |
| 2026-08-30 | GAP-11 | `package.json` creado en la raíz — la suite E2E nunca había podido instalarse/ejecutarse de forma reproducible | Shirley |
| 2026-08-30 | GAP-12 | `seed_dev_data` ahora crea `cliente_test` + `ClienteMayorista` vinculado, requerido por `tests/auth.spec.ts` (E4) | Shirley |
| 2026-08-30 | GAP-13 | `MEDIA_ROOT`/`STATIC_ROOT` corregidos de `BASE_DIR.parent` a `BASE_DIR` — los archivos subidos no persistían ni eran accesibles | Shirley |
| 2026-08-30 | — | `Select` con `value={x \|\| undefined}` alternaba entre no-controlado/controlado (warning de React) en `Documentos.tsx`, `Costeo.tsx`, `NuevaImportacion.tsx` — unificado a `value={x}` siempre string | Shirley |
| 2026-08-30 | — | Botones con `render={<a>/<Link>}` sin `nativeButton={false}` disparaban warning de accesibilidad de base-ui | Shirley |
| 2026-08-30 | — | `formatDate()` corría un día hacia atrás las fechas puras `YYYY-MM-DD` en zonas horarias negativas (America/La_Paz) por interpretarlas como medianoche UTC — afectaba fechas en toda la app, no solo Sprint 2 | Shirley |
