# Plan de Tareas — Fase 5 Completa (Sprint 4 cerrado)
## Trendy Import SRL · Fase 5

**Sprint:** 4 — Reportes, Bitácora y Suite E2E Completa (último de la Fase 5)
**Período:** 2026-11-02 → 2026-11-22 (planificado; trabajo adelantado desde 2026-09-02, cerrado el mismo día)
**Equipo:** Shirley Yessica Escobar Gutierrez · Oscar Alejandro Segovia Villarreal

> Nota: este archivo se saltó el tablero detallado de Sprint 3 (su seguimiento quedó solo en `docs/02-SESSION_MEM.md`). Los tableros de Sprint 1, 2 y 4 sí están documentados aquí en detalle.

---

## Tablero de Tareas — Sprint 4 (cerrado 2026-09-02)

### 🔴 Pendiente

*(Ninguna — Sprint 4 completo. Fase 5 completa: no hay sprint siguiente planificado.)*

### 🟡 En progreso

*(Ninguna)*

### ✅ Completado — Sprint 4

| ID | Tarea | Responsable | Fecha cierre | PR |
|----|-------|-------------|-------------|-----|
| **S4-T01** | Vista `/reportes` — gráfico de barras de importaciones por estado (cantidad + CIF total) + filtro de fechas | Agente | 2026-09-02 | `main` |
| **S4-T02** | Vista `/reportes` — gráfico de barras de pedidos por estado + filtro de cliente + exportación CSV | Agente | 2026-09-02 | `main` |
| **S4-T03** | Vista `/auditoria` — tabla paginada de bitácora con filtros de acción y usuario; backend `apps.auditoria` construido desde cero | Agente | 2026-09-02 | `main` |
| **S4-T04** | E2E Playwright: cobertura del flujo de reportes y bitácora (`tests/reportes.spec.ts`, 5 escenarios) | Agente | 2026-09-02 | `main` |
| **S4-T05** | E2E Playwright: regresión del flujo de importación — rama de cancelación + filtro de estado | Agente | 2026-09-02 | `main` |
| **S4-T06** | Cobertura de tests backend: `auditoria` (endpoint nuevo), `reportes` (GAP-5), fix `terceros` (GAP-10), `pytest`/`coverage` instalados (GAP-9) | Agente | 2026-09-02 | `main` |
| **S4-T07** | QA final: `tsc`, `oxlint`, `ruff` instalado y configurado (GAP-14), grep de invariantes, build, `migrate --check`, `check --deploy`, suite E2E completa | Agente | 2026-09-02 | `main` |

---

## Especificaciones técnicas — Sprint 4

### S4-T01/T02 · Vista Reportes

```
frontend/src/pages/reportes/Reportes.tsx
frontend/src/components/charts/BarChart.tsx
frontend/src/utils/csv.ts
frontend/src/types/reportes.ts
```

**Endpoints:** `GET /api/v1/reportes/importaciones/?fecha_desde=&fecha_hasta=` (agrupado por estado: `cantidad`, `total_cif`), `GET /api/v1/reportes/pedidos/?cliente=` (agrupado por estado: `cantidad`), `GET /api/v1/clientes-mayoristas/?page_size=100` (para poblar el `Select` de cliente).

**Reglas de UI:**
- Dos secciones independientes ("Importaciones por Estado", "Pedidos por Estado"), cada una con su propia fila de filtros — no se comparte un filtro global entre ambas porque escopan datos distintos.
- `BarChart` es un componente SVG propio, sin dependencia nueva de gráficos de terceros. Usa un único tono `fill-chart-1` (token `--chart-1` de `index.css`) porque la categoría (estado) ya la identifica la etiqueta del eje X — un color por barra sería decorativo, no informativo, en un gráfico de una sola serie.
- El CSV se genera enteramente en el cliente (`downloadCsv()`) a partir de los datos ya cargados por el gráfico/tabla — no hay endpoint de exportación en el backend.
- Roles permitidos: Administrador, Operador de Comercio Exterior, Contabilidad — **igual que `REPORTES_ROLES` del backend** (`apps/reportes/views.py`). No incluir Agente Aduanal (ver GAP-15 en `05-FINDINGS_DEUDA.md`: el backend nunca lo autorizó, aunque una versión anterior de la ruta del frontend sí lo dejaba pasar).

### S4-T03 · Vista Bitácora

```
backend/apps/auditoria/serializers.py
backend/apps/auditoria/views.py
backend/apps/auditoria/urls.py
frontend/src/pages/auditoria/Auditoria.tsx
frontend/src/types/auditoria.ts
```

**Endpoint:** `GET /api/v1/bitacora/?page=&search=&usuario=` — `ReadOnlyModelViewSet`, exclusivo de Administrador. `search` filtra por texto sobre `accion` (icontains, vía `SearchFilter`); `usuario` filtra por id exacto (vía `filterset_fields`). Nunca acepta POST/PATCH/DELETE — la única escritura es `auditoria_services.registrar()` desde los servicios de dominio.

**Reglas de UI:**
- El `Select` de usuario se puebla desde `GET /usuarios/?page_size=100` (mismo endpoint que consume `/usuarios`, acceso ya restringido a Administrador).
- El botón "Ver" de cada fila (deshabilitado si `detalle` está vacío) abre un `Dialog` con el JSON de `detalle` formateado en un `<pre>` — no se intenta dar un formato específico por tipo de acción, el JSON crudo es suficiente para el caso de uso de auditoría.

### S4-T04/T05 · E2E de cierre de Fase 5

```
tests/reportes.spec.ts
tests/importaciones.spec.ts (E2 agregado)
```

**Cobertura nueva de `reportes.spec.ts`:** gráfico de importaciones visible por `aria-label`, exportación CSV (verificada por evento `download` + nombre de archivo), filtro de fechas sin resultados, exportación CSV de pedidos, bloqueo de Cliente Mayorista en `/reportes` y en `/auditoria`, listado y filtro por acción de la bitácora.

**Cobertura nueva en `importaciones.spec.ts` (E2, regresión):** rama de cancelación (`REGISTRADA → CANCELADA`) no cubierta por el flujo feliz de S2-T07, y verificación de que el filtro de búsqueda por código de `/importaciones` (S2-T01) sigue funcionando tras la transición.

### S4-T06/T07 · Deuda de testing e infraestructura cerrada

- `backend/requirements.txt`: se agregaron `pytest`, `pytest-django`, `coverage` y `ruff` — ninguno estaba instalado pese a estar documentados como gates obligatorios desde Sprint 1 en `08-CONTROL_SESION.md` (GAP-9 y GAP-14 en `05-FINDINGS_DEUDA.md`).
- `backend/pyproject.toml` (nuevo): fija `select = ["E", "F", "W", "I"]` para `ruff`, en vez de depender de los defaults no documentados de la versión instalada (que incluían reglas como `RUF012`, incompatibles con los `Meta.fields = [...]` idiomáticos de DRF).
- `apps/terceros/tests.py`: corregida la URL de un test que apuntaba a `/api/v1/clientes/` (nunca existió) en vez de `/api/v1/clientes-mayoristas/` — GAP-10 era un bug del test, no de la API.
- Resultado medido: `coverage run manage.py test apps` → 85/85 tests, 94% de cobertura total; `npx playwright test` (raíz) → 12/12 PASSED.

---

## Tablero de Tareas — Sprint 2

### 🔴 Pendiente

*(Ninguna — Sprint 2 completo)*

### 🟡 En progreso

*(Ninguna)*

### ✅ Completado — Sprint 2

| ID | Tarea | Responsable | Fecha cierre | PR |
|----|-------|-------------|-------------|-----|
| **S2-T01** | Vista `/importaciones` — DataTable con filtros de estado y proveedor, búsqueda por código | Shirley | 2026-08-30 | `main` |
| **S2-T02** | Vista `/importaciones/nueva` — formulario de registro con CIF previsualizado + líneas de detalle | Shirley | 2026-08-30 | `main` |
| **S2-T03** | Vista `/importaciones/:id` — detalle, líneas de variantes ingresadas, modal de cambio de estado con stepper | Shirley | 2026-08-30 | `main` |
| **S2-T04** | Vista `/documentos` — selector de operación, upload multipart, descarga y eliminación | Shirley | 2026-08-30 | `main` |
| **S2-T05** | Vista `/costeo` — selector de operación, formulario de tributos, cálculo de costo total nacionalizado | Shirley | 2026-08-30 | `main` |
| **S2-T06** | Vista `/tipo-cambio` — CRUD tabla de tipo de cambio USD/BOB | Shirley | 2026-08-30 | `main` |
| **S2-T07** | E2E Playwright: flujo registrar → en tránsito → en aduana → liberar | Shirley | 2026-08-30 | `main` |

---

## Especificaciones técnicas — Sprint 2

### S2-T01 · Vista Importaciones

```
frontend/src/pages/importaciones/Importaciones.tsx
```

**Endpoint:** `GET /api/v1/importaciones/?page=&search=&estado=&proveedor=`. Filtros `estado` y `proveedor` vía `Select` de shadcn; `proveedor` se resuelve a nombre cruzando `GET /proveedores/?page_size=100`. Botón "Nueva Importación" visible solo para Admin/Operador, enlaza a `/importaciones/nueva`.

### S2-T03 · Vista Detalle de Importación

```
frontend/src/pages/importaciones/DetalleImportacion.tsx
```

**Endpoints:** `GET /api/v1/importaciones/{id}/` (incluye `detalles` con `variante_detalle` anidado — fix aplicado en `backend/apps/importaciones/serializers.py`), `GET /proveedores/{id}/`, `GET /agentes-aduanales/{id}/`, `GET /transportistas/{id}/` (solo si el FK no es null), `POST /api/v1/importaciones/{id}/actualizar-estado/`.

**Reglas de UI:**
- El botón "Cambiar Estado" solo es visible para `Administrador`, `Operador de Comercio Exterior` y `Agente Aduanal` (mismos roles que `ESTADO_ROLES` en `backend/apps/importaciones/views.py`).
- Las transiciones ofrecidas en el modal se calculan en frontend a partir de `TRANSICIONES_VALIDAS` (espejo de `backend/apps/importaciones/services.py`) — el backend sigue siendo la autoridad final y rechaza con 409 cualquier transición inválida.
- Toda transición requiere confirmación explícita en un `AlertDialog` antes de invocar la API.
- No se implementó edición de la operación (FOB/flete/seguro) en esta vista — fuera del alcance de S2-T03.

### S2-T05 · Vista Costeo y Tributos

```
frontend/src/pages/costeo/Costeo.tsx
```

**Endpoints:** `GET /api/v1/importaciones/?page_size=100` (selector), `GET /api/v1/costeos/?operacion={id}` (puede no existir aún — `results` vacío), `POST /api/v1/importaciones/{id}/calcular-costeo/` (crea/recalcula el `Costeo`), `POST /api/v1/tributos/`, `DELETE /api/v1/tributos/{id}/`.

**Reglas de UI:**
- `Tributo.monto` es siempre calculado por el backend (`base_imponible × porcentaje / 100`) — nunca se envía ni se edita en el frontend.
- El backend no recalcula `costo_total` automáticamente al crear/eliminar un tributo; el frontend marca el costeo como "desactualizado" tras cualquier cambio y exige una acción explícita de "Recalcular Costeo" (coincide con el flujo manual de CU-08).
- Si la operación no tiene `Costeo` todavía (nunca se llamó a `calcular-costeo`), el primer intento de agregar un tributo lo crea automáticamente antes de asociar el tributo (vía `get_or_create` del backend) — no se expone un botón separado de "crear costeo vacío".
- Eliminar un tributo requiere confirmación en `AlertDialog`.
- **Gotcha de UI encontrado:** el `Select` de shadcn/base-ui no renderiza el texto del `SelectItem` seleccionado por defecto — solo el `value`. Hay que pasar una función como `children` de `SelectValue` para mapear el valor al label correcto. Revisar cualquier `Select` nuevo que use un `value` distinto del texto visible.
- **Gotcha de UI encontrado (adicional):** el `value` de un `Select` controlado **nunca debe alternar entre `undefined` y un `string`** (ej. `value={x || undefined}`) — Base UI lo trata como un cambio de no-controlado a controlado y React lo marca como error. Usar siempre `value={x}` con `x` inicializado en `''`, y manejar el string vacío dentro de la función `children` de `SelectValue`.

### S2-T06 · Vista Tipo de Cambio

```
frontend/src/pages/costeo/TipoCambio.tsx
```

**Endpoints:** `GET/POST/PATCH/DELETE /api/v1/tipo-cambio/`. `fecha` es única (el backend devuelve 400 ante un duplicado); `valor` con 4 decimales.

**Nota:** esta vista y su ruta/ítem de sidebar no existían en absoluto antes de S2-T06, pese a que el tipo `TipoCambio` y el endpoint ya estaban listos desde Sprint 1.

### S2-T04 · Vista Documentos

```
frontend/src/pages/documentos/Documentos.tsx
```

**Endpoints:** `GET /api/v1/documentos/?operacion={id}`, `POST /api/v1/documentos/` (multipart — `api.ts` ya detecta `FormData` y omite `Content-Type`), `DELETE /api/v1/documentos/{id}/` (el backend rechaza con 409 si la operación está `LIBERADA`; el frontend oculta el botón en ese caso como UX, pero el backend sigue siendo la autoridad).

**Prerrequisito de infraestructura (roto hasta S2-T04, corregido en esta tarea):**
1. `MEDIA_ROOT`/`STATIC_ROOT` en `backend/config/settings/base.py` deben ser `BASE_DIR / "..."`, nunca `BASE_DIR.parent / "..."` — con `.parent` los archivos se escriben fuera de `/app/media`, que es el volumen Docker compartido con Nginx.
2. `nginx/nginx.conf` necesita `location /media/ { alias /app/media/; }` para servir los archivos subidos; sin esto, cualquier descarga cae en el catch-all que proxea al frontend y da 404.

### S2-T02 · Vista Nueva Importación

```
frontend/src/pages/importaciones/NuevaImportacion.tsx
```

**Endpoints:** `POST /api/v1/importaciones/` (datos generales) y luego un `POST /api/v1/detalles-importacion/` por cada línea agregada, en secuencia. Las variantes seleccionables se obtienen de `GET /prendas/?page_size=100` aplanando `prenda.variantes` (la lista de variantes no trae el nombre de la prenda anidado).

**Reglas de UI:**
- El CIF que se muestra en el formulario es **solo una previsualización calculada en el cliente** (`FOB + flete + seguro`); nunca se envía en el payload — el backend lo recalcula siempre (RF-04).
- No se permite seleccionar la misma variante en dos líneas distintas (validado en frontend antes de enviar).
- Si falla la creación de alguna línea después de crear la operación, se notifica cuántas fallaron pero se navega igual al detalle (la operación ya existe; el usuario decide si reintenta).

### S2-T07 · E2E Playwright — Flujo de Importación

```
tests/importaciones.spec.ts
```

**Prerrequisitos de infraestructura (rotos hasta esta tarea, corregidos aquí):**
1. No existía `package.json` en la raíz del repositorio — `@playwright/test` no estaba declarado como dependencia en ningún lado alcanzable por una instalación limpia. Se creó `package.json` en la raíz.
2. `seed_dev_data` no creaba el usuario `cliente_test` que `tests/auth.spec.ts` (escenario E4) asume — se agregó su creación junto a un `ClienteMayorista` vinculado.

**Cobertura:** registrar una importación con una línea de detalle → verificar que el CIF previsualizado coincide con el CIF real devuelto por el backend → avanzar las 3 transiciones de estado con confirmación → verificar que `LIBERADA` es terminal (sin botón "Cambiar Estado"). Verificado por fuera del test que la liberación generó `MovimientoInventario` (RF-09).

---

## Tablero de Tareas — Sprint 1 (cerrado 2026-08-30)

### ✅ Completado

| ID | Tarea | Responsable | Fecha cierre | PR |
|----|-------|-------------|-------------|-----|
| **S1-T01** | Instalar componentes shadcn/ui: `Table`, `Dialog`, `Input`, `Label`, `Select`, `Badge`, `Sonner`, `Card`, `Skeleton`, `AlertDialog` | Oscar | 2026-08-30 | `main` |
| **S1-T02** | Crear `AppLayout.tsx`: sidebar responsivo con nav filtrada por rol, header usuario/rol, logout con `AlertDialog` | Oscar | 2026-08-30 | `main` |
| **S1-T03** | Crear `AuthLayout.tsx` y refactorizar `Login.tsx` con Sonner toast + shadcn `Input`/`Label` | Oscar | 2026-08-30 | `main` |
| **S1-T04** | Crear `frontend/src/utils/formatters.ts`: `formatCurrency` BOB, `formatDate` español, `formatEstado` legible | Oscar | 2026-08-30 | `main` |
| **S1-T05** | Vista `/usuarios` — tabla paginada con rol coloreado (Badge por rol) y estado activo/inactivo | Oscar | 2026-08-30 | `main` |
| **S1-T06** | Vista `/proveedores` — Rediseño premium: Action Bar Card `shadow-primary/5`, Interactive Table `hover:bg-secondary/40` + cabeceras `bg-muted/50`, Dialog Shell `sm:max-w-150` grid 2 col (Razón Social/NIT · Fábrica/Ciudad · País/Tel · Email · Dir), icono `Power` toggle, AlertDialog suspensión lógica, foco `ring-primary`, toasts Sonner | Oscar | 2026-08-30 | `main` |
| **S1-T07** | Vista `/clientes-mayoristas` — Rediseño premium: Action Bar Card solo Admin, Interactive Table `hover:bg-secondary/40`, Select shadcn/ui para tipo negocio (`Boutique`, `Tienda Física`, `Online`), Dialog Shell `sm:max-w-150` grid 2 col, icono `Power` toggle, AlertDialog contextual de pedidos, payload sin `usuario`, foco `ring-primary`, toasts Sonner | Oscar | 2026-08-30 | `main` |
| **S1-T08** | Vista `/agentes-aduanales` — Rediseño premium (cierre de Sprint 1): Action Bar Card `p-6 shadow-primary/5` (Admin + Operador), Interactive Table `hover:bg-secondary/40` + cabeceras `bg-muted/50`, columna Contacto de dos líneas (tel + email), Dialog Shell `sm:max-w-150` grid 2 col (Razón Social/NIT · Registro Aduanero/Tel · Email full-width requerido · Dir full-width opcional), icono `Power` toggle, AlertDialog contextual de operaciones de importación, foco `ring-primary`, toasts Sonner | Oscar | 2026-08-30 | `main` |
| **S1-T09** | E2E Playwright: login válido → dashboard, credenciales inválidas → Toast, logout con AlertDialog, protección de ruta por rol | Oscar | 2026-08-30 | `main` |
| **S1-T10** | Tests unitarios `apps/auditoria/tests.py` — 7/7 PASSED: creación, SET_NULL, GenericFK | Oscar | 2026-08-30 | `main` |

---

## Especificaciones técnicas por tarea

### S1-T02 · AppLayout

```
frontend/src/layouts/AppLayout.tsx
```

**Requisitos:**
- El sidebar muestra los módulos a los que el rol activo tiene acceso (leer de `AuthContext.role`).
- En mobile (<768px) el sidebar colapsa a un menú hamburguesa.
- El header muestra `user.first_name + user.last_name` o `user.username` como fallback, el `role`, y un botón "Cerrar sesión" que llama a `logout()` del contexto.
- Al hacer logout exitoso, redirige automáticamente a `/login`.
- No usar `window.confirm()` para confirmar logout — usar un `AlertDialog` de shadcn/ui.

**Mapa de rutas por rol:**

| Módulo | Ruta | Administrador | Operador | Agente | Contabilidad | Cliente May. |
|--------|------|:---:|:---:|:---:|:---:|:---:|
| Dashboard | `/` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Usuarios | `/usuarios` | ✅ | — | — | — | — |
| Proveedores | `/proveedores` | ✅ | ✅ | ✅ | — | — |
| Clientes | `/clientes-mayoristas` | ✅ | ✅ | — | — | — |
| Agentes | `/agentes-aduanales` | ✅ | ✅ | ✅ | — | — |
| Catálogo | `/catalogo` | ✅ | ✅ | — | — | ✅ |
| Importaciones | `/importaciones` | ✅ | ✅ | ✅ | ✅ | — |
| Documentos | `/documentos` | ✅ | — | ✅ | — | — |
| Costeo | `/costeo` | ✅ | — | — | ✅ | — |
| Stock | `/stock` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Pedidos | `/pedidos` | ✅ | ✅ | — | ✅ | ✅ |
| Reportes | `/reportes` | ✅ | ✅ | ✅ | ✅ | — |
| Bitácora | `/auditoria` | ✅ | — | — | — | — |

---

### S1-T06 · Vista Proveedores

```
frontend/src/pages/terceros/Proveedores.tsx
```

**Endpoints que consume:**
- `GET /api/v1/proveedores/?page=N&search=X&activo=true|false`
- `POST /api/v1/proveedores/`
- `PATCH /api/v1/proveedores/:id/`

**Columnas de la tabla:** Razón social, NIT, País, Fábrica, Activo (badge), Acciones (editar / toggle activo).

**Reglas de UI:**
- Botón "Nuevo Proveedor" solo visible para Admin/Operador.
- El modal de edición reutiliza el mismo formulario que el modal de alta.
- El toggle de "Activo" muestra un `AlertDialog` de confirmación antes de ejecutar el PATCH.
- Los errores de la API (ej. NIT duplicado) se muestran en un Toast de tipo destructivo.
- No usar `window.alert` ni `window.confirm` en ningún punto.

---

### S1-T07 · Vista Clientes Mayoristas

```
frontend/src/pages/terceros/ClientesMayoristas.tsx
```

**Endpoints que consume:**
- `GET /api/v1/clientes-mayoristas/?page=N&search=X`
- `POST /api/v1/clientes-mayoristas/`
- `PATCH /api/v1/clientes-mayoristas/:id/`

**Campo especial:** `pedido_minimo_modelo` — input numérico con validación min=1. El valor se muestra en la columna de la tabla como "Mín. X unid./modelo".

---

### S1-T09 · Tests E2E con Playwright

```
tests/e2e/auth.spec.ts
```

**Casos a cubrir:**

```typescript
test('login válido redirige al dashboard')
test('login inválido muestra Toast de error sin redirigir')
test('logout limpia la sesión y redirige a /login')
test('ruta protegida sin sesión redirige a /login')
test('rol Agente Aduanal no puede acceder a /costeo')
test('rol Cliente Mayorista no puede acceder a /importaciones')
```

---

## Convenciones de Pull Request para este Sprint

Antes de abrir un PR hacia `dev`, el autor debe verificar:

```bash
# Backend (si se tocaron archivos Python)
docker compose exec backend python manage.py test apps --verbosity=2

# Frontend
npm run typecheck          # tsc --noEmit
npm run lint               # eslint

# Formato (opcional pero recomendado)
docker compose exec backend ruff check .
```

El compañero revisor verifica:
- [ ] Sin `window.alert/confirm/prompt`
- [ ] Sin estilos CSS inline
- [ ] Sin datos hardcodeados en el frontend
- [ ] Los componentes consumen datos de `api.ts`, no de `fetch`/`axios` directos
- [ ] Los campos `read_only` del backend no se envían en payloads de POST/PATCH
