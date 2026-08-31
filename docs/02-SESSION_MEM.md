# Memoria de Sesión Activa — Trendy Import SRL

> **Propósito:** Este archivo es la ancla de contexto para cualquier asistente de IA o integrante del equipo que inicie una sesión de trabajo. Refleja el estado actual del sprint y los objetivos vigentes. Se actualiza al inicio y al cierre de cada sesión de desarrollo.

---

## Estado Actual

| Campo | Valor |
|-------|-------|
| **Fase** | Fase 5 — Frontend de Negocio y Pruebas E2E |
| **Sprint activo** | **Sprint 3 de Fase 5: Catálogo Mayorista y Pedidos B2B — 🔄 En curso (S3-T01 completado)** |
| **Fecha de inicio del sprint** | 2026-10-12 (planificada) — trabajo adelantado desde 2026-08-31 |
| **Responsables** | Shirley Yessica Escobar Gutierrez · Oscar Alejandro Segovia Villarreal |
| **Estado del backend** | ✅ Estable — API REST v1 completa; fixes de Sprint 3: `PrendaSerializer.variantes` filtrado por rol, filtro combinado talla+color, `seed_dev_data` con catálogo demo (ver notas) |
| **Estado del frontend** | 🔄 Sprint 3 en curso — `/catalogo` implementada (S3-T01); pendientes: `VarianteSelector` (S3-T02), `/pedidos/nuevo` (S3-T03), `/pedidos` (S3-T04), `/pedidos/:id` (S3-T05), `/stock` (S3-T06) |

---

## Objetivos del Sprint 1 (Cerrado 2026-08-30)

- [x] **S1-T01** Instalar componentes shadcn/ui faltantes: `Table`, `Dialog`, `Input`, `Label`, `Select`, `Badge`, `Sonner`, `Card`, `Skeleton`, `AlertDialog`. *(2026-08-30 — Oscar)*
- [x] **S1-T02** Crear `AppLayout` en `frontend/src/layouts/AppLayout.tsx` con sidebar responsivo, header con nombre de usuario/rol y menú de navegación con rutas protegidas por rol. *(2026-08-30 — Oscar)*
- [x] **S1-T03** Crear `AuthLayout` en `frontend/src/layouts/AuthLayout.tsx` y refactorizar `Login.tsx` con Sonner toast. *(2026-08-30 — Oscar)*
- [x] **S1-T04** Crear `frontend/src/utils/formatters.ts` — `formatCurrency` BOB, `formatDate` español, `formatEstado` legible. *(2026-08-30 — Oscar)*
- [x] **S1-T05** Crear la vista `frontend/src/pages/admin/Usuarios.tsx` — tabla paginada con badge de rol por color. *(2026-08-30 — Oscar)*
- [x] **S1-T06** Rediseño premium de `frontend/src/pages/terceros/Proveedores.tsx` — Action Bar Card `p-6 shadow-primary/5`, Interactive Table `hover:bg-secondary/40` + cabeceras `bg-muted/50 font-semibold`, Dialog Shell `sm:max-w-150` grid 2 col, icono `Power` toggle, foco `ring-primary`, AlertDialog suspensión lógica, toasts Sonner. *(2026-08-30 — Oscar/Agente)*
- [x] **S1-T07** Rediseño premium de `frontend/src/pages/terceros/ClientesMayoristas.tsx` — Action Bar Card `p-6 shadow-primary/5` (solo Admin), Interactive Table `hover:bg-secondary/40`, Dialog Shell `sm:max-w-150` grid 2 col con Select shadcn/ui para tipo negocio, icono `Power` toggle, foco `ring-primary`, AlertDialog contextual de pedidos, toasts Sonner. *(2026-08-30 — Oscar/Agente)*
- [x] **S1-T08** Rediseño premium de `frontend/src/pages/terceros/AgentesAduanales.tsx` — Action Bar Card `p-6 shadow-primary/5` (Admin + Operador), columna Contacto de dos líneas (tel + email), Dialog Shell `sm:max-w-150` grid 2 col (Razón Social/NIT · Registro/Tel · Email full-width · Dir full-width), icono `Power` toggle, AlertDialog contextual de importaciones, foco `ring-primary`, toasts Sonner. Sprint 1 cerrado al 100%. *(2026-08-30 — Oscar/Agente)*
- [x] **S1-T09** Escribir tests E2E con Playwright para el flujo de login y protección de rutas. *(2026-08-30 — Oscar)*
- [x] **S1-T10** Tests `apps/auditoria/tests.py` — cobertura del servicio `registrar()`. *(2026-08-30 — Oscar)*

## Objetivos del Sprint 2 (Cerrado 2026-08-30)

- [x] **S2-T01** Vista `/importaciones` — DataTable con filtros de estado y proveedor. *(2026-08-30 — Shirley)*
- [x] **S2-T02** Vista `/importaciones/nueva` — formulario de registro con cálculo CIF y líneas de detalle. *(2026-08-30 — Shirley)*
- [x] **S2-T03** Vista `/importaciones/:id` — detalle + líneas + cambio de estado (modal). *(2026-08-30 — Shirley)*
- [x] **S2-T04** Vista `/documentos` — listado por importación + upload multipart. *(2026-08-30 — Shirley)*
- [x] **S2-T05** Vista `/costeo` — detalle de costeo + formulario de tributos. *(2026-08-30 — Shirley)*
- [x] **S2-T06** Vista `/tipo-cambio` — CRUD tabla de tipo de cambio USD/BOB. *(2026-08-30 — Shirley)*
- [x] **S2-T07** E2E Playwright: flujo registrar → en tránsito → en aduana → liberar. *(2026-08-30 — Shirley)*

> Nota: en `04-SPRINTS.md` las tareas S2-T02, S2-T04, S2-T06 y S2-T07 estaban asignadas a Oscar. Por pedido explícito de Shirley ("hacer todo el Sprint 2 para avanzar más rápido"), se completaron también en esta sesión. Si Oscar ya había avanzado alguna de estas en paralelo, revisar conflictos de merge antes de integrar.

---

## Objetivos del Sprint 3 (En curso desde 2026-08-31)

- [x] **S3-T01** Vista `/catalogo` — grid de prendas con filtros de talla/color/categoría contra la API; imágenes de ropa juvenil por categoría (Unsplash, sin campo de imagen en el backend). *(2026-08-31 — Shirley/Agente)*
- [ ] **S3-T02** Componente `VarianteSelector` — tarjeta de variante con stock badge.
- [ ] **S3-T03** Vista `/pedidos/nuevo` — carrito de pedido con validación de mínimo en cliente.
- [ ] **S3-T04** Vista `/pedidos` — lista de pedidos con filtro de estado (diferenciada por rol).
- [ ] **S3-T05** Vista `/pedidos/:id` — detalle de pedido + cambio de estado para staff.
- [ ] **S3-T06** Vista `/stock` — inventario con movimientos por variante.
- [ ] **S3-T07** E2E Playwright: flujo de pedido.

> Nota: S3-T01 requirió 3 fixes de backend no previstos en la planificación original (ver `01-BITACORA_DESARROLLO.md`, entrada 2026-08-31): `PrendaSerializer.variantes` filtraba mal las variantes anidadas para el Cliente Mayorista, el queryset no exigía stock>0 a nivel de Prenda, y el filtro combinado talla+color tenía un bug de JOIN cruzado. Los tres eran necesarios para cumplir los criterios de aceptación del sprint, no alcance añadido.

---

## Deuda Técnica Activa

| ID | Severidad | Descripción | Responsable |
|----|-----------|-------------|-------------|
| GAP-1 | 🔴 Crítico | Vistas de negocio pendientes (Sprint 3): Stock, Pedidos (Catálogo ya resuelto en S3-T01) | Shirley + Oscar |
| GAP-5 | 🟢 Bajo | Tests de `reportes` son mínimos (25 líneas) | Shirley |
| GAP-9 | 🟡 Medio | `pytest` no está instalado en el contenedor backend (falta en `requirements.txt`); `apps/auditoria/tests.py` no puede ejecutarse ni con `pytest` ni con `manage.py test` (usa fixtures de pytest) | Sin asignar |
| GAP-10 | 🟢 Bajo | `apps.terceros.tests.ClienteMayoristaApiTests.test_cliente_consulta_su_propio_registro` falla con 404 en `main` (preexistente, no introducido en Sprint 2) | Sin asignar |

Todos los GAP de Sprint 1/2 (`GAP-2` a `GAP-8`, incluido `GAP-6` de subida de documentos) están resueltos — ver historial en `05-FINDINGS_DEUDA.md`.

Ver detalle completo en [`docs/05-FINDINGS_DEUDA.md`](05-FINDINGS_DEUDA.md).

---

## Contexto técnico para la sesión

### Lo que está hecho y NO se debe tocar sin revisión

- **Backend completo:** todos los modelos, migraciones, servicios de negocio y endpoints de `/api/v1/` están implementados y testeados. No modificar modelos sin crear migraciones.
- **Autenticación:** `AuthContext`, `authService`, `api.ts` y `ProtectedRoute` funcionan correctamente. No introducir JWT ni cambiar el mecanismo de cookies.
- **Rutas protegidas:** `App.tsx` ya define todas las rutas con sus roles permitidos. Los `ModulePlaceholder` deben reemplazarse con componentes reales, no eliminarse directamente.

### Decisiones arquitectónicas que no se deben revertir

1. `on_delete=models.PROTECT` en todas las relaciones de negocio maestras.
2. CIF, costeo y validación de stock mínimo son responsabilidad exclusiva del backend.
3. Autenticación por sesión con cookies HttpOnly — sin JWT.
4. Cero estilos inline — solo clases utilitarias de Tailwind CSS v4.
5. Cero `window.alert()` — usar Toasts (Sonner) y modales accesibles.

### Convención de ramas para este sprint

```
dev                          ← rama de integración
  └── feature/s1-layout-shell         (Oscar)
  └── feature/s1-shadcn-components    (Shirley)
  └── feature/s1-crud-proveedores     (Shirley)
  └── feature/s1-crud-clientes        (Oscar)
  └── feature/s1-e2e-auth             (ambos)
```

---

## Notas de la última sesión (2026-08-30 — sesión 2)

- **S1-T01 ✅:** 10 componentes shadcn/ui instalados (`table`, `input`, `label`, `select`, `badge`, `card`, `skeleton`, `sonner`, `dialog`, `alert-dialog`). Se corrigió `sonner.tsx` para eliminar dependencia `next-themes` incompatible con Vite.
- **S1-T04 ✅:** `frontend/src/utils/formatters.ts` creado — `formatCurrency` (BOB), `formatDate` (español), `formatEstado` (snake_case → legible).
- **S1-T03 ✅:** `AuthLayout.tsx` creado — layout B2B de dos columnas. `Login.tsx` refactorizado con shadcn `Input`/`Label` y Sonner `toast.error()` en lugar de error inline.
- **S1-T02 ✅:** `AppLayout.tsx` creado — sidebar fijo desktop / hamburguesa mobile, nav filtrada por `role` según matriz de `06-TASK_PLAN.md`, `AlertDialog` de confirmación para logout. `App.tsx` actualizado a rutas anidadas con `<Outlet />`.
- `tsc --noEmit` — 0 errores. `npm run lint` — 0 errores propios.
- **S1-T09 ✅ · S1-T10 ✅:** Tests Playwright y suite unitaria de auditoría escritos y ejecutados. `pytest apps/auditoria/` → 7/7 PASSED.
- **Fix healthcheck Docker ✅:** `curl` reemplazado por `urllib.request` en healthcheck del backend (`python:3.12-slim` no incluye `curl`). Stack completo levanta sin errores.
- **Fix login 404 ✅:** `VITE_API_URL` corregido de `/api/v1` a `/api`. `authService.ts` desacoplado de env var — usa `AUTH_BASE='/api/auth'`. Login funcional verificado en navegador.
- **UI AuthLayout ✅:** Panel izquierdo rediseñado — `bg-zinc-950`, orbes decorativos, hero text, feature list y 4 stats.
- **S1-T06 ✅ (rediseño premium):** `Proveedores.tsx` rediseñado bajo Ley de Consistencia Visual — Action Bar Card, tabla interactiva con hover, Dialog Shell `sm:max-w-150` grid 2 col, icono `Power` para toggle, AlertDialog con mensaje contextual, toasts Sonner. `tsc --noEmit` — 0 errores.
- **S1-T07 ✅ (rediseño premium):** `ClientesMayoristas.tsx` rediseñado — Action Bar Card solo Admin, Select shadcn/ui para tipo de negocio, Dialog Shell grid 2 col, icono `Power` toggle, AlertDialog contextual de pedidos, payload sin campo `usuario`. `tsc --noEmit` — 0 errores.
- **S1-T08 ✅ (rediseño premium — cierre de Sprint 1):** `AgentesAduanales.tsx` rediseñado — `canWrite` corregido a Admin + Operador, columna Contacto de dos líneas, Dialog Shell `sm:max-w-150` grid 2 col, Email marcado como requerido, Dirección como opcional, icono `Power`, AlertDialog contextual de operaciones de importación. `tsc --noEmit` — 0 errores. **Sprint 1 completado al 100%.**

---

## Notas de la última sesión (2026-08-30 — sesión 3, Sprint 2)

- **`npm install` en `frontend/`:** `node_modules/sonner` no estaba instalado (bloqueaba `tsc --noEmit` en todo el proyecto). Ejecutado y verificado — 0 vulnerabilidades.
- **S2-T01 ✅:** `frontend/src/pages/importaciones/Importaciones.tsx` — DataTable paginada consumiendo `GET /api/v1/importaciones/` con filtros reales de backend (`estado`, `proveedor` vía `Select` de shadcn, `search` por código). Nombre de proveedor resuelto cruzando `GET /proveedores/`. Botón "Nueva Importación" (Admin/Operador) enlaza a `/importaciones/nueva`. Extraje `ESTADO_IMPORTACION_COLOR` / `TRANSICIONES_VALIDAS` a `frontend/src/utils/importacionesUi.ts` para compartir con el detalle.
- **S2-T03 ✅:** `frontend/src/pages/importaciones/DetalleImportacion.tsx` — detalle de operación (proveedor/agente/transportista resueltos por `GET` individual), tarjetas FOB/Flete/Seguro/CIF, tabla de variantes ingresadas, y modal de cambio de estado con stepper visual del pipeline lineal + `AlertDialog` de doble confirmación antes de `POST /importaciones/{id}/actualizar-estado/`.
- **Fix de backend (hallado durante pruebas manuales) ✅:** `DetalleImportacionNestedSerializer` en `backend/apps/importaciones/serializers.py` no incluía `variante_detalle` — el detalle de importación mostraba talla/color vacíos. Se agregó el campo anidado (mismo patrón que el serializer completo). Verificado con `python manage.py test apps.importaciones apps.catalogo` → 21/21 OK.
- **Tipo faltante:** se agregó `Transportista` a `frontend/src/types/terceros.ts` (existía en el backend pero no en el frontend).
- **Verificación manual E2E (Playwright ad-hoc, no committeado):** login → `/importaciones` → filtros → "Ver detalle" → modal "Cambiar Estado" → confirmación → transición `REGISTRADA → EN_TRANSITO` reflejada en vivo con toast. Datos de prueba creados y eliminados en la BD de desarrollo tras la verificación.
- **Deuda nueva detectada (no introducida por esta sesión, preexistente en `main`):** `pytest` falta en `backend/requirements.txt` (el contenedor no lo tiene instalado, `apps/auditoria/tests.py` no corre); `apps.terceros.tests.ClienteMayoristaApiTests.test_cliente_consulta_su_propio_registro` falla con 404 tanto antes como después de los cambios de hoy. Ver GAP-9 y GAP-10 en `05-FINDINGS_DEUDA.md`.
- **S2-T05 ✅:** `frontend/src/pages/costeo/Costeo.tsx` — selector de operación, tarjetas de resumen (CIF / costo total nacionalizado), formulario de tributos (`ARANCEL`/`IVA`, base imponible, porcentaje), tabla de tributos con eliminación confirmada, banner de "costeo desactualizado" y acción de (re)calcular costeo total vía `POST /importaciones/{id}/calcular-costeo/`.
- **Fix de UI encontrado ✅:** el `Select` de shadcn (base-ui) no muestra el texto del ítem seleccionado por defecto, solo el `value` — mostraba el id numérico crudo en vez del nombre. Corregido con `children` como función en `SelectValue` en `Costeo.tsx` y en los 2 filtros de `Importaciones.tsx` (estado y proveedor) que tenían el mismo defecto sin haberlo notado hasta la prueba visual.
- **Nota de infraestructura:** Vite dentro de Docker (bind mount en macOS) a veces no detecta la creación de un archivo nuevo hasta reiniciar el contenedor (`docker compose restart frontend`). Si una ruta nueva sigue mostrando el `ModulePlaceholder` viejo pese a estar bien registrada en `App.tsx`, reiniciar el contenedor antes de asumir que el código está mal.
- **Próxima acción (cumplida):** S2-T02, S2-T04, S2-T06 y S2-T07 — ver notas de la sesión 4 a continuación. **Sprint 2 cerrado al 100%.**

---

## Notas de la última sesión (2026-08-30 — sesión 4, cierre de Sprint 2)

- **S2-T06 ✅:** `frontend/src/pages/costeo/TipoCambio.tsx` — CRUD completo (crear/editar/eliminar) de `TipoCambio` con `AlertDialog` de confirmación de borrado. Se agregó el ítem "Tipo de Cambio" al sidebar (`AppLayout.tsx`, ícono `DollarSign`) y la ruta `/tipo-cambio` en `App.tsx` — **no existían en ninguno de los dos archivos**, a pesar de que el backend y el tipo `TipoCambio` ya existían desde Sprint 1.
- **S2-T04 ✅:** `frontend/src/pages/documentos/Documentos.tsx` — selector de operación, formulario de adjunto multipart (tipo, nombre, fecha de emisión, archivo vía `FormData`), tabla de documentos con descarga y eliminación (bloqueada si la operación está `LIBERADA`, replicando la regla del backend).
- **Fix de infraestructura crítico ✅ (bloqueaba S2-T04):** `MEDIA_ROOT` y `STATIC_ROOT` en `backend/config/settings/base.py` usaban `BASE_DIR.parent` (`Path.parent` mal calculado), lo que resolvía a `/media` y `/staticfiles` en la raíz del contenedor **en vez de** `/app/media` y `/app/staticfiles`. Como `docker-compose.yml` monta `media_volume` en `/app/media` (compartido con Nginx), los archivos subidos se guardaban fuera del volumen: existían en la base de datos pero eran inaccesibles y no persistían. Corregido a `BASE_DIR / "media"` / `BASE_DIR / "staticfiles"`.
- **Fix de infraestructura ✅:** `nginx/nginx.conf` no tenía ningún `location /media/` — las descargas de documentos caían en el catch-all `location /` (proxy al frontend) y devolvían 404. Se agregó `location /media/ { alias /app/media/; }` y `client_max_body_size 20M;` (GAP-6 lo dejaba pendiente de verificar; estaba roto en dos capas distintas).
- **S2-T02 ✅:** `frontend/src/pages/importaciones/NuevaImportacion.tsx` — formulario de alta con datos generales (proveedor/agente/transportista/fecha/ruta), valores FOB/flete/seguro con **previsualización de CIF solo informativa** (el valor real siempre lo calcula el backend, nunca se envía en el payload), y una tabla de líneas de detalle dinámica (agregar/quitar, con variantes obtenidas de `GET /prendas/?page_size=100` aplanando `prenda.variantes`, evitando repetir la misma variante en dos líneas). Al enviar: crea la operación (`POST /importaciones/`) y luego cada línea (`POST /detalles-importacion/`), y redirige al detalle.
- **Fix de UI ✅ (mismo patrón que el de `Costeo.tsx` de la sesión 3, pero más grave):** todos los `Select` que usaban `value={x || undefined}` producían el warning de React "a component is changing the uncontrolled value state of Select to be controlled" — porque `undefined` y luego un `string` son dos modos distintos (no controlado → controlado) para Base UI. Se corrigió a `value={x}` (siempre string, nunca `undefined`) en `Documentos.tsx`, `Costeo.tsx` y `NuevaImportacion.tsx`, ajustando las funciones `children` de `SelectValue` para manejar el string vacío como caso de placeholder.
- **Fix de UI ✅:** botones que renderizan un `<a>`/`<Link>` vía la prop `render` de shadcn `Button` (base-ui) disparaban la advertencia "expected a native `<button>`". Se agregó `nativeButton={false}` en esos casos (`Documentos.tsx` descarga, `Importaciones.tsx` "Nueva Importación").
- **Fix de bug real de fechas ✅ (afectaba TODA la app, no solo Sprint 2):** `formatDate()` en `frontend/src/utils/formatters.ts` interpretaba fechas puras `"YYYY-MM-DD"` como medianoche UTC; al mostrarlas con `toLocaleDateString` en una zona horaria negativa (el proyecto usa `America/La_Paz`, UTC-4), el día se corría hacia atrás (`2026-08-30` se mostraba como "29 de agosto de 2026"). Reproducido y corregido agregando `T00:00:00` (hora local) cuando el string no trae componente de hora. Afectaba `fecha_registro` de importaciones, `fecha_emision` de documentos y `fecha` de tipo de cambio.
- **Gap de infraestructura crítico encontrado y corregido ✅:** **no existía ningún `package.json` en la raíz del repositorio.** `playwright.config.ts` y `tests/auth.spec.ts` (documentados como "7/7 y 4/4 PASSED" en sesiones anteriores) **nunca pudieron haberse ejecutado tal cual** desde una instalación limpia — `@playwright/test` no estaba declarado en ninguna parte fuera de una caché global de `npx`. Se creó `package.json` en la raíz con `@playwright/test` como devDependency y se corrió `npm install`.
- **Gap de datos de seed encontrado y corregido ✅:** `tests/auth.spec.ts` (escenario E4) asume un usuario `cliente_test / TestPass123!` con rol Cliente Mayorista, pero `seed_dev_data` **nunca lo creaba** — solo crea `admin`. Al correr la suite real por primera vez, E4 falló por timeout (login nunca redirige porque el usuario no existe). Se agregó la creación de `cliente_test` + un registro `ClienteMayorista` vinculado en `backend/apps/usuarios/management/commands/seed_dev_data.py`.
- **S2-T07 ✅:** `tests/importaciones.spec.ts` — flujo E2E completo: login → `/importaciones/nueva` → completar datos + 1 línea de detalle → verificar CIF previsualizado y CIF real coinciden → `/importaciones/:id` → 3 transiciones de estado (`REGISTRADA→EN_TRANSITO→EN_ADUANA→LIBERADA`) cada una con confirmación → verifica que `LIBERADA` es terminal (botón "Cambiar Estado" desaparece). Verificado también por fuera de Playwright que la liberación generó el `MovimientoInventario` de tipo `ENTRADA` (RF-09).
- **Verificación final:** `tsc --noEmit` — 0 errores; `oxlint` — 0 errores propios; `python manage.py test apps` → 62/64 OK (los 2 fallos son `GAP-9`/`GAP-10`, preexistentes, confirmados con `git stash` que no los causó esta sesión); `npx playwright test` (desde la raíz) → **5/5 PASSED** (`auth.spec.ts` 4 + `importaciones.spec.ts` 1). Todos los datos de prueba creados durante la verificación fueron eliminados de la base de datos de desarrollo al finalizar.