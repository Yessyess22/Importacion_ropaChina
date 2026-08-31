# Memoria de Sesión Activa — Trendy Import SRL

> **Propósito:** Este archivo es la ancla de contexto para cualquier asistente de IA o integrante del equipo que inicie una sesión de trabajo. Refleja el estado actual del sprint y los objetivos vigentes. Se actualiza al inicio y al cierre de cada sesión de desarrollo.

---

## Estado Actual

| Campo | Valor |
|-------|-------|
| **Fase** | Fase 5 — Frontend de Negocio y Pruebas E2E |
| **Sprint activo** | **Sprint 2 de Fase 5: Importaciones, Documentos y Costeo** |
| **Fecha de inicio del sprint** | 2026-08-30 |
| **Fecha de cierre estimada** | 2026-09-20 |
| **Responsables** | Shirley Yessica Escobar Gutierrez · Oscar Alejandro Segovia Villarreal |
| **Estado del backend** | ✅ Estable — API REST v1 completa, sin cambios pendientes |
| **Estado del frontend** | 🚧 En construcción — Módulos transaccionales de importaciones y aduanas (Sprint 2 activo) |

---

## Objetivos del Sprint 1 (Activos)

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

---

## Deuda Técnica Activa (del Sprint anterior)

| ID | Severidad | Descripción | Responsable |
|----|-----------|-------------|-------------|
| GAP-1 | 🔴 Crítico | Todas las vistas de negocio del frontend son `ModulePlaceholder` | Shirley + Oscar |
| ~~GAP-2~~ | ~~🔴 Bloqueante~~ | ~~`src/layouts/` vacío~~ | ✅ Resuelto 2026-08-30 |
| ~~GAP-3~~ | ~~🟡 Medio~~ | ~~shadcn/ui incompleto~~ | ✅ Resuelto 2026-08-30 |
| ~~GAP-4~~ | ~~🟡 Medio~~ | ~~`apps/auditoria/tests.py` sin cobertura real~~ | ✅ Resuelto 2026-08-30 |
| GAP-5 | 🟢 Bajo | Tests de `reportes` son mínimos (25 líneas) | Shirley |

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
- **Próxima acción:** Sprint 2 — Inicialización y desarrollo de la vista `/importaciones` (S2-T01) para el listado operativo logístico.
