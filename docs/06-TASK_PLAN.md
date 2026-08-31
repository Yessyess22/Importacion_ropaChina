# Plan de Tareas — Sprint 2 Activo
## Trendy Import SRL · Fase 5

**Sprint:** 2 — Operaciones de Importación, Documentos y Costeo
**Período:** 2026-09-21 → 2026-10-11 (planificado; trabajo adelantado desde 2026-08-30)
**Equipo:** Shirley Yessica Escobar Gutierrez · Oscar Alejandro Segovia Villarreal

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
| **S1-T06** | Vista `/proveedores` — DataTable + modal alta/edición + AlertDialog toggle activo | Oscar | 2026-08-30 | `main` |
| **S1-T07** | Vista `/clientes-mayoristas` — DataTable + modal con `pedido_minimo_modelo` validado (min=1) | Oscar | 2026-08-30 | `main` |
| **S1-T08** | Vista `/agentes-aduanales` — DataTable + modal de alta/edición + AlertDialog toggle activo | Oscar | 2026-08-30 | `main` |
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
