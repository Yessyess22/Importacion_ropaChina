# Plan de Tareas — Sprint 1 Activo
## Trendy Import SRL · Fase 5

**Sprint:** 1 — Autenticación, Layout Shell y CRUDs Maestros
**Período:** 2026-08-30 → 2026-09-20
**Equipo:** Shirley Yessica Escobar Gutierrez · Oscar Alejandro Segovia Villarreal

---

## Tablero de Tareas

### 🔴 Pendiente

| ID | Tarea | Responsable | Dependencias | SP |
|----|-------|-------------|-------------|-----|
| **S1-T09** | E2E con Playwright: login válido → dashboard, login inválido → error Toast, logout → `/login`, redirección de rol no autorizado | Ambos | S1-T03 ✅ | 3 |
| **S1-T10** | Tests `apps/auditoria/tests.py`: crear importación → verificar registro Bitacora, snapshot de usuario_repr | Oscar | Ninguna (backend) | 2 |

### 🟡 En progreso

*(Mover tareas aquí cuando se inicia el trabajo — incluir fecha y rama de Git)*

| ID | Tarea | Responsable | Rama | Fecha inicio |
|----|-------|-------------|------|-------------|
| — | — | — | — | — |

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
