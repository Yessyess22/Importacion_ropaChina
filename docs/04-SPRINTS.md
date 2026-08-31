# Planificación de Sprints — Fase 5
## Trendy Import SRL

**Fase:** 5 — Frontend de Negocio y Pruebas E2E
**Equipo:** Shirley Yessica Escobar Gutierrez · Oscar Alejandro Segovia Villarreal
**Duración de cada sprint:** ~3 semanas académicas

---

## Resumen de Fase 5

| Sprint | Nombre | Período estimado | Estado |
|--------|--------|-----------------|--------|
| Sprint 1 | Autenticación, Layout y CRUDs Maestros | 2026-08-30 → 2026-09-20 | ✅ Cerrado |
| Sprint 2 | Importaciones, Documentos y Costeo | 2026-09-21 → 2026-10-11 | ✅ Cerrado (adelantado, 2026-08-30) |
| Sprint 3 | Catálogo Mayorista y Pedidos | 2026-10-12 → 2026-11-01 | ⏳ Pendiente |
| Sprint 4 | Reportes, Bitácora y Pruebas E2E | 2026-11-02 → 2026-11-22 | ⏳ Pendiente |

---

## Sprint 1 — Autenticación, Layout Shell y CRUDs Maestros

**Objetivo:** Dejar la infraestructura visual del frontend completamente operativa y construir todas las vistas de administración de datos maestros (Terceros, Usuarios).

### Criterios de Aceptación del Sprint

- [x] El login redirige al dashboard mostrando nombre y rol del usuario.
- [x] El sidebar muestra solo las rutas permitidas para el rol activo.
- [x] El sistema de Toast (Sonner) funciona para éxitos y errores.
- [x] Un Administrador puede crear, editar y desactivar Usuarios desde la UI (contraseña hasheada en backend; `AlertDialog` de confirmación de cambio de estado).
- [x] Un Administrador puede crear, editar y desactivar Proveedores desde la UI.
- [x] Un Administrador puede crear y editar Clientes Mayoristas desde la UI.
- [x] Un Administrador puede crear y editar Agentes Aduanales desde la UI.
- [x] Las tablas de datos muestran paginación funcional consumiendo `?page=` de la API.
- [x] El test E2E de login y logout pasa en Playwright.

### Tareas detalladas

| ID | Tarea | Responsable | Rama | SP estimados |
|----|-------|-------------|------|-------------|
| S1-T01 | Instalar shadcn/ui: `Table`, `Dialog`, `Form`, `Input`, `Select`, `Badge`, `Sonner` | Shirley | `feature/s1-shadcn-components` | 2 |
| S1-T02 | Crear `AppLayout` (sidebar responsivo, header, nav por rol) | Oscar | `feature/s1-layout-shell` | 5 |
| S1-T03 | Crear `AuthLayout` y refactorizar `Login.tsx` | Shirley | `feature/s1-layout-shell` | 2 |
| S1-T04 | Crear `frontend/src/utils/formatters.ts` (moneda BOB, fechas, estados ES) | Oscar | `feature/s1-utils` | 1 |
| S1-T05 | Vista `/usuarios` — CRUD completo (tabla paginada, modal alta/edición con grid 2 col, AlertDialog toggle estado, toasts) · backend: `UsuarioWriteSerializer` + `ModelViewSet` | Oscar | `feature/s1-crud-usuarios` | 5 |
| S1-T06 | Vista `/proveedores` — DataTable + modal de alta/edición/desactivar | Shirley | `feature/s1-crud-proveedores` | 5 |
| S1-T07 | Vista `/clientes-mayoristas` — DataTable + modal + pedido_minimo_modelo | Oscar | `feature/s1-crud-clientes` | 5 |
| S1-T08 | Vista `/agentes-aduanales` — DataTable + modal | Shirley | `feature/s1-crud-agentes` | 3 |
| S1-T09 | E2E Playwright: login válido, login inválido, logout, redirección por rol | Ambos | `feature/s1-e2e-auth` | 3 |
| S1-T10 | Tests de `apps/auditoria/tests.py` — cobertura del servicio `registrar()` | Oscar | `feature/s1-fix-auditoria-tests` | 2 |

**Total SP Sprint 1:** 31

---

## Sprint 2 — Operaciones de Importación, Documentos y Costeo

**Objetivo:** Implementar el flujo completo de gestión de importaciones desde el frontend: registro, gestión de detalles, transición de estados, carga de documentos y cálculo de costeo.

### Criterios de Aceptación del Sprint

- [x] Un Operador puede registrar una nueva importación; el CIF se muestra calculado automáticamente.
- [x] La tabla de importaciones muestra filtros por estado y proveedor.
- [x] El cambio de estado de la importación (transición aduanera) funciona desde un modal de confirmación.
- [~] Al liberar una importación, el sistema genera la entrada de stock correspondiente (verificado directamente en `MovimientoInventario`); la vista `/stock` en sí es de Sprint 3 (S3-T06) y aún no existe.
- [x] Un Agente Aduanal puede subir documentos (PDF/imagen) y verlos en la vista de detalle.
- [x] Un Contador puede registrar tributos y ejecutar `calcular-costeo`; el resultado se muestra en pantalla.
- [x] El test E2E del flujo completo de importación (registrar → liberar) pasa en Playwright.

### Tareas detalladas

| ID | Tarea | Responsable | Rama | SP estimados |
|----|-------|-------------|------|-------------|
| S2-T01 | Vista `/importaciones` — DataTable con filtros de estado y proveedor | Shirley | `feature/s2-lista-importaciones` | 5 |
| S2-T02 | Vista `/importaciones/nueva` — formulario de registro con cálculo CIF | Oscar | `feature/s2-form-importacion` | 8 |
| S2-T03 | Vista `/importaciones/:id` — detalle + líneas + cambio de estado (modal) | Shirley | `feature/s2-detalle-importacion` | 8 |
| S2-T04 | Vista `/documentos` — listado por importación + upload multipart | Oscar | `feature/s2-documentos` | 5 |
| S2-T05 | Vista `/costeo` — detalle de costeo + formulario de tributos | Shirley | `feature/s2-costeo` | 5 |
| S2-T06 | Vista `/tipo-cambio` — CRUD tabla de tipo de cambio USD/BOB | Oscar | `feature/s2-tipo-cambio` | 3 |
| S2-T07 | E2E Playwright: flujo registrar → en tránsito → en aduana → liberar | Ambos | `feature/s2-e2e-importacion` | 5 |

**Total SP Sprint 2:** 39

> **Nota de ejecución (2026-08-30):** Sprint 2 se cerró completo en una sola sesión. La columna "Responsable" refleja la planificación original; en la práctica Shirley implementó las 7 tareas (incluidas S2-T02, S2-T04, S2-T06 y S2-T07, planificadas para Oscar) a pedido explícito, para adelantar el sprint. Antes de integrar a `dev`, verificar con Oscar si ya había avance propio en `feature/s2-form-importacion`, `feature/s2-documentos`, `feature/s2-tipo-cambio` o `feature/s2-e2e-importacion` para evitar conflictos.

---

## Sprint 3 — Catálogo Mayorista y Pedidos B2B

**Objetivo:** Construir la experiencia del Cliente Mayorista: catálogo de variantes publicadas con filtros de talla/color, creación de pedido con validación de cantidad mínima, y vista de seguimiento de pedidos.

### Criterios de Aceptación del Sprint

- [ ] El Cliente Mayorista ve solo variantes publicadas con stock > 0.
- [ ] El catálogo filtra por talla, color y categoría dinámicamente desde la API.
- [ ] El formulario de pedido agrupa variantes por modelo y muestra la cantidad mínima requerida.
- [ ] Si la cantidad mínima no se cumple, se muestra un Toast de error claro antes de enviar la solicitud.
- [ ] Si el stock es insuficiente, el backend rechaza el pedido y el frontend muestra el error.
- [ ] El cliente puede ver sus pedidos en `/pedidos` con el estado actual.
- [ ] El Administrador puede cambiar el estado de un pedido (Confirmado → En preparación → Enviado → Entregado).
- [ ] El test E2E del flujo de pedido (agregar variantes → confirmar → ver en lista) pasa.

### Tareas detalladas

| ID | Tarea | Responsable | Rama | SP estimados |
|----|-------|-------------|------|-------------|
| S3-T01 | Vista `/catalogo` — grid de prendas con variantes (filtros talla/color/categoría) | Shirley | `feature/s3-catalogo-grid` | 8 |
| S3-T02 | Componente `VarianteSelector` — tarjeta de variante con stock badge | Oscar | `feature/s3-variante-selector` | 5 |
| S3-T03 | Vista `/pedidos/nuevo` — carrito de pedido con validación de mínimo en cliente | Oscar | `feature/s3-form-pedido` | 8 |
| S3-T04 | Vista `/pedidos` — lista de pedidos con filtro de estado (diferenciada por rol) | Shirley | `feature/s3-lista-pedidos` | 5 |
| S3-T05 | Vista `/pedidos/:id` — detalle de pedido + cambio de estado para staff | Oscar | `feature/s3-detalle-pedido` | 5 |
| S3-T06 | Vista `/stock` — inventario con movimientos por variante | Shirley | `feature/s3-inventario` | 5 |
| S3-T07 | E2E Playwright: flujo pedido (selección → error mínimo → corrección → confirmación) | Ambos | `feature/s3-e2e-pedido` | 5 |

**Total SP Sprint 3:** 41

---

## Sprint 4 — Reportes, Bitácora y Suite E2E Completa

**Objetivo:** Completar los módulos de inteligencia de negocio (reportes y bitácora) y garantizar la cobertura de pruebas E2E sobre todos los flujos críticos.

### Criterios de Aceptación del Sprint

- [ ] El Contador/Admin ve un reporte de importaciones agrupado por estado con valor CIF total, filtrable por rango de fechas.
- [ ] El Contador/Admin ve un reporte de pedidos agrupado por estado.
- [ ] Los reportes se muestran en gráfico de barras y tabla descargable como CSV.
- [ ] El Administrador ve la bitácora de auditoría paginada y puede filtrar por acción y usuario.
- [ ] La suite completa de tests E2E cubre: login, catálogo, crear importación, crear pedido, reportes.
- [ ] `tsc --noEmit` pasa sin errores en el frontend.
- [ ] `pytest` pasa con cobertura ≥ 80% en el backend.
- [ ] `ruff` y `eslint` no reportan errores.

### Tareas detalladas

| ID | Tarea | Responsable | Rama | SP estimados |
|----|-------|-------------|------|-------------|
| S4-T01 | Vista `/reportes` — gráfico de barras de importaciones por estado + filtro de fechas | Oscar | `feature/s4-reportes` | 8 |
| S4-T02 | Vista `/reportes` — gráfico de pedidos por estado + exportación CSV | Shirley | `feature/s4-reportes-pedidos` | 5 |
| S4-T03 | Vista `/auditoria` — tabla paginada de bitácora con filtros | Oscar | `feature/s4-bitacora` | 5 |
| S4-T04 | E2E Playwright: cobertura del flujo de reportes | Shirley | `feature/s4-e2e-reportes` | 3 |
| S4-T05 | E2E Playwright: cobertura del flujo de importación completo (regresión) | Oscar | `feature/s4-e2e-regresion` | 5 |
| S4-T06 | Aumentar cobertura tests backend: `auditoria`, `reportes` | Ambos | `feature/s4-backend-tests` | 3 |
| S4-T07 | Revisión final de tipos TypeScript (`tsc --noEmit`), linting y accesibilidad | Ambos | `feature/s4-qa-final` | 3 |

**Total SP Sprint 4:** 32

---

## Métricas de Calidad por Sprint

| Métrica | Sprint 1 | Sprint 2 | Sprint 3 | Sprint 4 |
|---------|----------|----------|----------|----------|
| Tests backend (pytest) | ≥ 70% | ≥ 75% | ≥ 78% | ≥ 85% |
| Tests E2E (Playwright) | Login/logout | Importación | Pedido | Todos |
| TypeScript sin errores | ✅ obligatorio | ✅ obligatorio | ✅ obligatorio | ✅ obligatorio |
| Ruff / ESLint limpio | ✅ obligatorio | ✅ obligatorio | ✅ obligatorio | ✅ obligatorio |
| Estilos inline | 0 | 0 | 0 | 0 |
| `window.alert/confirm` | 0 | 0 | 0 | 0 |
