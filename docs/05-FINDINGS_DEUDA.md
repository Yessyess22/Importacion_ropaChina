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
| **Estado** | 🔴 Abierto |

**Descripción:** Todas las rutas del frontend excepto `/login` y `/` (dashboard mínimo) renderizan un componente `ModulePlaceholder` sin lógica de consumo de API. El backend tiene una API REST completa y funcional, pero no existe ninguna pantalla de negocio construida para: Catálogo, Importaciones, Pedidos, Costeo, Inventario, Terceros, Reportes ni Bitácora.

**Impacto:** El sistema no puede ser usado por ningún rol salvo para iniciar y cerrar sesión.

**Resolución:**
- Sprint 1: CRUDs de Terceros y Usuarios
- Sprint 2: Importaciones, Documentos, Costeo
- Sprint 3: Catálogo y Pedidos

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
| **Estado** | 🔴 Abierto |

**Descripción:** `backend/apps/auditoria/tests.py` contiene 3 líneas (solo import vacío). El servicio `auditoria_services.registrar()` es llamado explícitamente desde `importaciones/services.py` y `pedidos/services.py`, pero no tiene ningún test que verifique:
- Que el registro de `Bitacora` se crea correctamente al crear una importación.
- Que el `usuario_repr` se guarda como snapshot del nombre de usuario.
- Que el `detalle` JSON contiene los campos esperados.
- Que el registro persiste aunque el usuario sea eliminado (SET_NULL).

**Impacto:** Si se introduce un bug en `registrar()`, los tests de integración de otras apps no lo detectarán directamente.

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
| **Propietario** | Oscar |
| **Estado** | 🔴 Abierto |

**Descripción:** El modelo `Documento.archivo` tiene un `FileField` declarado y migrado. La API de documentos existe en el backend, pero el frontend no implementa la carga multipart de archivos. Tampoco se ha probado que el backend procesa correctamente un `FormData` con archivo adjunto.

**Resolución:**
- El cliente `api.ts` ya detecta `FormData` y omite el header `Content-Type` (correcto para multipart).
- Implementar un componente de upload en Sprint 2 que use `api.post()` con un `FormData`.
- Verificar que `nginx.conf` tiene `client_max_body_size` suficiente para archivos PDF típicos.

---

## Deuda Estructural (no urgente, mejora a futuro)

### GAP-7 — Carpeta `tests/` raíz vacía

| Campo | Valor |
|-------|-------|
| **Severidad** | 🟢 Bajo |
| **Sprint objetivo** | Sprint 4 |
| **Estado** | 🔴 Abierto |

**Descripción:** La carpeta `tests/` en la raíz del proyecto contiene solo un `README.md`. Los tests E2E de Playwright deben ubicarse aquí según la arquitectura definida.

---

### GAP-8 — Documentos de gobernanza incompletos en `docs/`

| Campo | Valor |
|-------|-------|
| **Severidad** | 🟢 Bajo |
| **Sprint objetivo** | Sprint 1 (completado al generar esta documentación) |
| **Estado** | ✅ Resuelto (2026-08-30) |

**Descripción:** Los archivos `01-BITACORA_DESARROLLO.md`, `02-SESSION_MEM.md`, `05-FINDINGS_DEUDA.md` y `06-TASK_PLAN.md` referenciados en el protocolo de trabajo no existían. Generados como parte de la puesta a punto de Fase 5.

---

## Historial de Deuda Resuelta

| Fecha resolución | ID | Descripción | Resuelto por |
|-----------------|----|-------------|-------------|
| 2026-08-30 | GAP-8 | Documentos de gobernanza creados | Oscar |
| 2026-08-30 | GAP-2 | `AppLayout.tsx` y `AuthLayout.tsx` creados; rutas anidadas con `Outlet` en `App.tsx` | Oscar |
| 2026-08-30 | GAP-3 | 10 componentes shadcn/ui instalados + corrección de `sonner.tsx` para Vite | Oscar |
