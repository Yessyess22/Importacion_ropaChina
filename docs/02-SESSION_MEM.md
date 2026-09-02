# Memoria de Sesión Activa — Trendy Import SRL

> **Propósito:** Este archivo es la ancla de contexto para cualquier asistente de IA o integrante del equipo que inicie una sesión de trabajo. Refleja el estado actual del sprint y los objetivos vigentes. Se actualiza al inicio y al cierre de cada sesión de desarrollo.

---

## Estado Actual

| Campo | Valor |
|-------|-------|
| **Fase** | Fase 5 — Frontend de Negocio y Pruebas E2E — **✅ Completa (4/4 sprints cerrados)** |
| **Sprint activo** | **Sprint 4 de Fase 5: Reportes, Bitácora y Suite E2E Completa — ✅ Cerrado (S4-T01 a S4-T07 completados). No hay sprint siguiente planificado en `04-SPRINTS.md`; la Fase 5 está completa.** |
| **Fecha de inicio del sprint** | 2026-11-02 (planificada) — trabajo adelantado desde 2026-09-02, cerrado el mismo día |
| **Responsables** | Shirley Yessica Escobar Gutierrez · Oscar Alejandro Segovia Villarreal |
| **Estado del backend** | ✅ Estable — API REST v1 completa, incluyendo el endpoint de bitácora (`GET /api/v1/bitacora/`) construido en S4-T03. `pytest`, `pytest-django`, `coverage` y `ruff` ahora instalados en el contenedor (ver GAP-9/GAP-14 resueltos) |
| **Estado del frontend** | ✅ Sprint 4 completo — `/reportes` (gráficos + CSV) y `/auditoria` (bitácora paginada con filtros) implementados. **No queda ningún `ModulePlaceholder` en `App.tsx`: las 13 rutas de negocio del mapa de roles están construidas.** |

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
- [x] **S3-T02** Componente `VarianteSelector` — tarjeta de variante con stock badge (verde/ámbar/agotado), stepper de cantidad y botón "Agregar". *(2026-09-01 — Agente)*
- [x] **S3-T03** Vista `/pedidos/nuevo` — carrito de pedido agrupado por modelo, validación de mínimo en cliente (propio para Cliente Mayorista, o del cliente seleccionado por Admin/Operador), envío a `POST /pedidos/`. *(2026-09-01 — Agente)*
- [x] **S3-T04** Vista `/pedidos` — lista de pedidos con filtro de estado y cliente (Admin/Operador), sin columna/filtro de cliente para Cliente Mayorista (ya filtrado por el backend a su propio registro); ruta placeholder `/pedidos/:id` registrada para no romper el link "Ver detalle" hasta S3-T05. *(2026-09-01 — Agente)*
- [x] **S3-T05** Vista `/pedidos/:id` — detalle de pedido (cliente, fecha, total, líneas) + modal de cambio de estado con stepper (Administrador/Operador), solo lectura para Cliente Mayorista/Contabilidad. *(2026-09-01 — Agente)*
- [x] **S3-T06** Vista `/stock` — tabla de variantes (`GET /variantes/`) con estado/stock por umbral y modal de ledger de movimientos por variante (`GET /movimientos-inventario/`). Se corrigió `allowedRoles` de la ruta y del ítem de sidebar: el backend nunca permitió lectura de `movimientos-inventario` a Cliente Mayorista, pero el placeholder sí lo dejaba entrar — ahora coincide (Administrador/Operador/Contabilidad/Agente Aduanal). *(2026-09-01 — Agente)*
- [x] **S3-T07** E2E Playwright: flujo de pedido (`tests/pedidos.spec.ts`) — selección de variante → bloqueo por mínimo incumplido → corrección de cantidad → confirmación → verificación en `/pedidos`. **Sprint 3 cerrado al 100%.** *(2026-09-01 — Agente)*

> Nota: S3-T01 requirió 3 fixes de backend no previstos en la planificación original (ver `01-BITACORA_DESARROLLO.md`, entrada 2026-08-31): `PrendaSerializer.variantes` filtraba mal las variantes anidadas para el Cliente Mayorista, el queryset no exigía stock>0 a nivel de Prenda, y el filtro combinado talla+color tenía un bug de JOIN cruzado. Los tres eran necesarios para cumplir los criterios de aceptación del sprint, no alcance añadido.

> Nota: S3-T02/S3-T03 no requirieron cambios de backend — `POST /pedidos/` y `GET /clientes-mayoristas/` ya soportaban todo lo necesario (filtrado por rol y `pedido_minimo_modelo`). Verificado end-to-end en navegador (Playwright ad-hoc, no committeado): Cliente Mayorista bloqueado por mínimo, luego pedido confirmado y stock descontado; Administrador con selector de cliente y su mínimo correspondiente. Datos de prueba (1 pedido) revertidos manualmente al finalizar (stock restaurado vía `inventario.services.registrar_entrada`, bitácora y pedido eliminados).

---

## Objetivos del Sprint 4 (Cerrado 2026-09-02)

- [x] **S4-T01** Vista `/reportes` — gráfico de barras de importaciones por estado (cantidad + CIF total) con filtro de rango de fechas. *(2026-09-02 — Agente)*
- [x] **S4-T02** Vista `/reportes` — gráfico de barras de pedidos por estado con filtro de cliente y exportación CSV. *(2026-09-02 — Agente)*
- [x] **S4-T03** Vista `/auditoria` — tabla paginada de bitácora con filtro por acción (búsqueda de texto) y usuario (`Select`); requirió construir `backend/apps/auditoria/{serializers,views,urls}.py` desde cero. *(2026-09-02 — Agente)*
- [x] **S4-T04** E2E Playwright (`tests/reportes.spec.ts`) — 5 escenarios: reporte de importaciones (gráfico/tabla/CSV/filtro de fechas), reporte de pedidos (CSV), bloqueo de Cliente Mayorista en `/reportes`, bitácora con filtro por acción, bloqueo de Cliente Mayorista en `/auditoria`. *(2026-09-02 — Agente)*
- [x] **S4-T05** E2E Playwright de regresión — nuevo escenario en `tests/importaciones.spec.ts` cubriendo la rama de cancelación (`REGISTRADA → CANCELADA`, no cubierta por el flujo feliz de S2-T07) y el filtro de estado de `/importaciones`. *(2026-09-02 — Agente)*
- [x] **S4-T06** Cobertura de tests backend — `apps/reportes/tests.py` ampliado a 9 tests (agregación + filtros, cierra GAP-5); `apps/auditoria/tests.py` con 5 tests nuevos para el endpoint de bitácora; `pytest`/`pytest-django`/`coverage` instalados (cierra GAP-9); fix de URL en `apps/terceros/tests.py` (cierra GAP-10). **85/85 tests, 94% de cobertura total.** *(2026-09-02 — Agente)*
- [x] **S4-T07** QA final — `tsc --noEmit` 0 errores, `oxlint` 0 errores (mismos warnings preexistentes `set-state-in-effect`), grep de invariantes (estilos inline, `window.alert`, `fetch` directo) sin coincidencias, `npm run build` exitoso, `ruff` instalado y configurado (`backend/pyproject.toml`, cierra GAP-14) con 0 errores tras reformatear el backend, `python manage.py check --deploy` sin errores nuevos, `npx playwright test` 12/12 PASSED. *(2026-09-02 — Agente)*

> Nota: durante S4-T01 se detectó y corrigió `GAP-15` — el frontend permitía a Agente Aduanal entrar a `/reportes` pero el backend (`REPORTES_ROLES`) nunca lo autorizó; quedaba oculto porque la ruta era un `ModulePlaceholder` sin llamadas a la API.

---

## Deuda Técnica Activa

No hay deuda técnica activa registrada. Todos los GAP de Sprint 1 a 4 (`GAP-1` a `GAP-15`) están resueltos — ver historial completo en `05-FINDINGS_DEUDA.md`.

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

---

## Notas de la última sesión (2026-09-02 — sesión 5, cierre de Sprint 4 — Fase 5 completa)

- **S4-T01/T02 ✅:** `frontend/src/pages/reportes/Reportes.tsx` — dos secciones ("Importaciones por Estado", "Pedidos por Estado"), cada una con su propia fila de filtros (rango de fechas para importaciones; `Select` de cliente para pedidos), dos gráficos de barras SVG hechos a medida (`frontend/src/components/charts/BarChart.tsx`, sin nueva dependencia de terceros) para cantidad y CIF total, tabla con badges reutilizando `ESTADO_IMPORTACION_COLOR`/`ESTADO_PEDIDO_COLOR` ya existentes, y botón "Exportar CSV" (`frontend/src/utils/csv.ts`, genera el archivo enteramente en cliente a partir de los datos ya cargados, sin endpoint nuevo).
- **Paleta del gráfico:** se usó `fill-chart-1` (token `--chart-1` de `index.css`, ya definido desde Sprint 1 pero sin usar hasta ahora) en vez de un color por barra — con la categoría ya identificada por la etiqueta del eje X, un solo tono es la elección correcta según la skill de dataviz (evita "color decorativo" y reserva la paleta categórica para cuando el color es el único canal de identidad). Barras con esquina superior redondeada de 4px, tope cuadrado en la base, valor y categoría como texto directo (nunca oculto solo en un tooltip), `<title>` nativo de SVG para hover/lectura de pantalla.
- **S4-T03 ✅:** `backend/apps/auditoria/{serializers,views,urls}.py` creados desde cero — no existía ningún endpoint para `Bitacora`, solo el modelo y el servicio `registrar()`. `BitacoraViewSet` es `ReadOnlyModelViewSet` (la única escritura sigue siendo `auditoria_services.registrar()`), `permission_classes=[IsAuthenticated, HasRole(Roles.ADMINISTRADOR)]`, `filterset_fields=["usuario"]` + `search_fields=["accion"]`. Registrado en `config/urls_v1.py`. Frontend: `frontend/src/pages/auditoria/Auditoria.tsx` — tabla paginada con filtro de texto por acción y `Select` de usuario (poblado desde `GET /usuarios/?page_size=100`), y un `Dialog` con el JSON de `detalle` formateado para cada fila que lo tiene.
- **Fix de consistencia real encontrado en S4-T01 (GAP-15) ✅:** `REPORTES_ROLES` en el backend (`apps/reportes/views.py`, desde Fase 4) nunca incluyó a `Agente Aduanal`, pero tanto la ruta de `App.tsx` como el ítem de sidebar de `AppLayout.tsx` sí lo dejaban entrar a `/reportes` — quedaba oculto porque antes era un `ModulePlaceholder` sin llamadas a la API. Corregido quitando `Agente Aduanal` de ambos `allowedRoles`.
- **S4-T04 ✅:** `tests/reportes.spec.ts` — 5 escenarios: reporte de importaciones (gráfico visible, exportación CSV con nombre de archivo verificado, filtro de fechas sin resultados), reporte de pedidos (exportación CSV), Cliente Mayorista bloqueado en `/reportes`, bitácora (listado, filtro por acción con y sin resultados), Cliente Mayorista bloqueado en `/auditoria`.
- **S4-T05 ✅ (regresión):** nuevo test en `tests/importaciones.spec.ts` cubre la rama de cancelación (`REGISTRADA → CANCELADA`, la única transición que el flujo feliz de S2-T07 no ejercitaba) y confirma que el filtro de búsqueda por código de `/importaciones` (S2-T01) sigue funcionando y muestra el estado actualizado.
- **S4-T06 ✅ — deuda de testing e infraestructura cerrada de una vez:**
  - `GAP-9` (pytest no instalado): se agregaron `pytest==8.*`, `pytest-django==4.*`, `coverage==7.*` a `backend/requirements.txt` y se reconstruyó la imagen (`docker compose build backend`).
  - `GAP-10` (test de `terceros` fallaba con 404): la causa real era que el test pegaba a `/api/v1/clientes/`, una URL que nunca existió — el router registra `clientes-mayoristas`. No era un bug de la API; se corrigió la URL en el test.
  - `GAP-5` (tests de reportes mínimos): `apps/reportes/tests.py` ampliado de 25 líneas a 3 clases / 9 tests, cubriendo agregación `Count`/`Sum` por estado, filtro `fecha_desde`/`fecha_hasta`/rango combinado, y filtro por `cliente`.
  - `apps/auditoria/tests.py`: 5 tests nuevos (`BitacoraApiTests`) para el endpoint recién creado — permiso exclusivo de Administrador, filtro por usuario, búsqueda por acción, y que el endpoint rechaza escritura (405 en POST).
  - Resultado: **85/85 tests en verde**, **94% de cobertura total** (`coverage report`, muy por encima del 85% objetivo de Sprint 4).
- **S4-T07 ✅ — QA final:**
  - `GAP-14` (nuevo, encontrado en esta tarea): `ruff` estaba documentado como gate obligatorio desde Sprint 1 en `08-CONTROL_SESION.md` pero **nunca había estado instalado** — al agregarlo y correrlo por primera vez sin ningún `pyproject.toml`, reportó 170 errores (152 de ellos `RUF012`, un falso positivo masivo sobre los `Meta.fields = [...]` idiomáticos de DRF) y 48 archivos jamás pasados por `ruff format`. Se creó `backend/pyproject.toml` fijando `select = ["E", "F", "W", "I"]` explícitamente (en vez de confiar en los defaults no documentados de la versión instalada), se corrigieron los 7 errores reales restantes (imports) y se corrió `ruff format .` una única vez sobre todo el backend (cambios mecánicos de espaciado, sin alterar lógica).
  - `tsc --noEmit` — 0 errores. `oxlint` — 0 errores (mismos warnings preexistentes `set-state-in-effect`, patrón compartido por casi todas las páginas del proyecto desde Sprint 1, no introducido ni agravado esta sesión). `npm run build` — build de producción exitoso.
  - Grep de invariantes (`style={{`, `window.alert/confirm/prompt`, `fetch(` fuera de `services/`) — sin coincidencias en todo `frontend/src/`.
  - `python manage.py migrate --check` — sin migraciones pendientes. `python manage.py check --deploy` — sin errores nuevos (mismos `WARNING` de configuración de producción, esperables en entorno de desarrollo).
  - `npx playwright test` (suite completa, stack Docker activo) → **12/12 PASSED** (4 `auth.spec.ts` + 2 `importaciones.spec.ts` + 1 `pedidos.spec.ts` + 5 `reportes.spec.ts`).
- **Verificación visual:** `/reportes` y `/auditoria` verificados en navegador real vía Playwright ad-hoc (no committeado) — gráficos renderizan con las barras y valores esperados, tabla de bitácora muestra fecha/usuario/acción/entidad, y el diálogo de detalle despliega el JSON de `detalle` correctamente formateado.
- **Cierre de Fase 5:** con Sprint 4 cerrado, no queda ningún `ModulePlaceholder` en `App.tsx` — las 13 rutas de negocio del mapa de roles de `06-TASK_PLAN.md`/`04-SPRINTS.md` están implementadas y probadas. `docs/00-CONTEXTO_PROYECTO.md` actualizado para reflejar la Fase 5 completa.