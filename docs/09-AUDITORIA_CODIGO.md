# Reporte de Auditoría de Código — Trendy Import SRL

**Fecha:** 2026-08-30 | **Rama:** `main` | **Commits auditados:** últimos 4

---

## 1. Estructura del Proyecto

```
Importacion_ropaChina/
├── backend/
│   ├── apps/
│   │   ├── auditoria/     ← modelos + service (tests vacíos)
│   │   ├── catalogo/      ← modelos + views + serializers + tests
│   │   ├── costeo/        ← modelos + service + views + tests
│   │   ├── documentos/    ← modelos + views + tests
│   │   ├── importaciones/ ← modelos + service + views + tests
│   │   ├── inventario/    ← modelos + service + views + tests
│   │   ├── pedidos/       ← modelos + service + views + tests
│   │   ├── reportes/      ← solo views (sin modelos ni migraciones)
│   │   ├── terceros/      ← modelos + views + tests
│   │   └── usuarios/      ← modelos + auth + views + permissions + tests
│   ├── config/
│   │   ├── settings/      ← base.py / development.py / production.py
│   │   ├── urls.py + urls_v1.py
│   │   ├── exceptions.py  ← custom exception handler + ConflictError
│   │   └── pagination.py
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── components/    ← ProtectedRoute + ui/button (shadcn)
│       ├── context/       ← AuthContext.tsx ✅
│       ├── hooks/         ← useAuth.ts ✅
│       ├── layouts/       ← VACÍO (.gitkeep)
│       ├── pages/         ← SOLO Login.tsx (resto son placeholders en App.tsx)
│       ├── services/      ← api.ts + authService.ts ✅
│       ├── types/         ← auth, catalogo, costeo, importaciones, pedidos, terceros ✅
│       └── utils/         ← VACÍO (.gitkeep)
├── nginx/nginx.conf       ✅
├── docker-compose.yml     ✅ (4 servicios: postgres, backend, frontend, nginx)
└── docs/
    ├── 00-CONTEXTO_PROYECTO.md
    ├── 07-PROMPT_DESARROLLO.md
    ├── api.md / authentication.md / database.md
    └── postman/           ← colección Postman presente
    ⚠️ FALTAN: 01-BITACORA, 02-SESSION_MEM, 05-FINDINGS_DEUDA, 06-TASK_PLAN
```

**Docker Compose:** los 4 servicios están declarados correctamente. Nginx corre en el puerto 80 como único punto de entrada unificado. El backend usa `DJANGO_SETTINGS_MODULE: config.settings.development`. No hay healthcheck configurado para los servicios backend ni frontend.

---

## 2. Mapeo de Modelos y Base de Datos

| Modelo | App | Campos clave | Migraciones | Estado |
|--------|-----|-------------|-------------|--------|
| `Rol` | usuarios | nombre (unique), descripcion, activo | `0001_initial` | ✅ Completo |
| `Usuario` | usuarios | AbstractUser + `rol` FK | `0001_initial` | ✅ Completo |
| `Prenda` | catalogo | codigo_modelo (unique), nombre, categoria, temporada, coleccion, activo | `0001_initial` | ✅ Completo |
| `VarianteProducto` | catalogo | prenda FK, talla, color, precio_unitario, stock_disponible, estado (choices) | `0001_initial` | ✅ Completo |
| `Tercero` (abstract) | terceros | razon_social, nit (unique), telefono, email, direccion, activo | — | ✅ Completo |
| `Proveedor` | terceros | + fabrica, ciudad_origen, pais | `0001 + 0002` | ✅ Completo |
| `ClienteMayorista` | terceros | + tipo_negocio, pedido_minimo_modelo, usuario OneToOne | `0001 + 0002` | ✅ Completo |
| `AgenteAduanal` | terceros | + numero_registro | `0001 + 0002` | ✅ Completo |
| `Transportista` | terceros | + tipo_transporte (choices) | `0001 + 0002` | ✅ Presente (extra no listado en docs de diseño) |
| `OperacionImportacion` | importaciones | codigo_unico, proveedor/agente/transportista FK, estado, fob/flete/seguro/cif | `0001 + 0002` | ✅ Completo |
| `DetalleImportacion` | importaciones | operacion FK, variante FK, cantidad, costo_unitario_fob | `0001 + 0002` | ✅ Completo |
| `Costeo` | costeo | operacion OneToOne, costo_total, fecha_calculo | `0001 + 0002` | ✅ Completo |
| `Tributo` | costeo | costeo FK, tipo, partida_arancelaria, base_imponible, porcentaje, monto | `0001 + 0002` | ✅ Completo |
| `TipoCambio` | costeo | fecha (unique), valor | `0001 + 0002` | ✅ Completo |
| `Documento` | documentos | operacion FK, tipo (choices), nombre, archivo (FileField), fecha_emision | `0001 + 0002` | ✅ Completo |
| `MovimientoInventario` | inventario | variante FK, tipo, cantidad, origen (GenericFK), observacion, fecha | `0001_initial` | ✅ Completo |
| `PedidoMayorista` | pedidos | codigo_pedido (unique), cliente FK, fecha, estado | `0001 + 0002` | ✅ Completo |
| `DetallePedido` | pedidos | pedido FK, variante FK, cantidad, precio_unitario (snapshot) | `0001 + 0002` | ✅ Completo |
| `Bitacora` | auditoria | usuario FK (SET_NULL), accion, entidad (GenericFK), detalle (JSON), fecha_hora | `0001 + 0002` | ✅ Completo |
| _Reportes_ | reportes | **Sin modelos** (vistas de agregación puras) | Sin migraciones | ✅ Correcto |

### 2.1 Restricción `on_delete` — Auditoría de PROTECT vs CASCADE

**PROTECT — relaciones de negocio maestras (correcto):**
- `Usuario → Rol`
- `VarianteProducto → Prenda`
- `OperacionImportacion → {Proveedor, AgenteAduanal, Transportista}`
- `DetalleImportacion → VarianteProducto`
- `MovimientoInventario → VarianteProducto`
- `PedidoMayorista → ClienteMayorista`
- `DetallePedido → VarianteProducto`

**CASCADE — registros hijo (justificado por diseño):**
- `DetalleImportacion → OperacionImportacion` — líneas hija de su cabecera ✅
- `Costeo → OperacionImportacion` — OneToOne dependiente ✅
- `Tributo → Costeo` — componente hijo de costeo ✅
- `Documento → OperacionImportacion` — adjuntos de la operación ✅
- `DetallePedido → PedidoMayorista` — líneas hija ✅

**SET_NULL — casos de referencia opcional (justificado):**
- `Bitacora → Usuario` — el log sobrevive al borrar la cuenta ✅
- `ClienteMayorista → Usuario` — vínculo de cuenta opcional ✅
- `MovimientoInventario / Bitacora → ContentType` — GenericFK nullable ✅

**Conclusión:** Ningún `CASCADE` viola la invariante del repositorio. Todos aplican a relaciones de línea-detalle, no a entidades de negocio maestras.

---

## 3. Análisis del Backend — API REST v1

### 3.1 Endpoints implementados

| Endpoint | ViewSet / View | Acciones extra | Roles con acceso |
|----------|---------------|----------------|-----------------|
| `POST /api/auth/login/` | `LoginView` | — | Público |
| `POST /api/auth/logout/` | `LogoutView` | — | Autenticados |
| `GET /api/auth/me/` | `MeView` | fija cookie CSRF | Autenticados |
| `/api/v1/proveedores/` | `ProveedorViewSet` | CRUD | Admin, Operador, Agente, Contabilidad |
| `/api/v1/clientes-mayoristas/` | `ClienteMayoristaViewSet` | CRUD (filtrado por dueño) | Staff + ClienteMay. (propio) |
| `/api/v1/agentes-aduanales/` | `AgenteAduanalViewSet` | CRUD | Staff |
| `/api/v1/transportistas/` | `TransportistaViewSet` | CRUD | Staff |
| `/api/v1/prendas/` | `PrendaViewSet` | CRUD (visión mayorista filtrada) | Todos; escritura: Admin/Operador |
| `/api/v1/variantes/` | `VarianteProductoViewSet` | + `publicar` POST | Todos; escritura: Admin/Operador |
| `/api/v1/importaciones/` | `OperacionImportacionViewSet` | + `actualizar-estado`, `calcular-costeo` | Sin DELETE; sin ClienteMay. |
| `/api/v1/detalles-importacion/` | `DetalleImportacionViewSet` | CRUD | Staff |
| `/api/v1/documentos/` | `DocumentoViewSet` | CRUD | Staff |
| `/api/v1/costeos/` | `CosteoViewSet` | CRUD | Admin, Contabilidad |
| `/api/v1/tributos/` | `TributoViewSet` | CRUD (auto-calcula monto) | Admin, Contabilidad |
| `/api/v1/tipo-cambio/` | `TipoCambioViewSet` | CRUD | Admin, Contabilidad |
| `/api/v1/movimientos/` | `MovimientoInventarioViewSet` | + `entrada`, `salida`, `ajuste` | Lectura: Staff; escritura: Admin/Operador |
| `/api/v1/pedidos/` | `PedidoMayoristaViewSet` | + `actualizar-estado` | Sin edit/delete; ClienteMay. ve solo propios |
| `/api/v1/detalles-pedido/` | `DetallePedidoViewSet` | ReadOnly | ClienteMay. ve solo propios |
| `GET /api/v1/reportes/importaciones/` | `ReporteImportacionesView` | `?fecha_desde&fecha_hasta` | Admin, Operador, Contabilidad |
| `GET /api/v1/reportes/pedidos/` | `ReportePedidosView` | `?cliente` | Admin, Operador, Contabilidad |

### 3.2 Lógica de servicios de negocio

| Algoritmo requerido | Servicio | Estado |
|---------------------|----------|--------|
| CIF = FOB + Flete + Seguro | `importaciones/services.calcular_cif()` | ✅ Implementado |
| CIF calculado en servidor, nunca confiado del cliente HTTP | `crear_operacion` ignora `valor_cif` del payload | ✅ Implementado |
| Recálculo de CIF al actualizar la operación | `actualizar_operacion` | ✅ Implementado |
| Costeo total = CIF + Σ tributos | `costeo/services.calcular_costeo()` | ✅ Implementado |
| Monto tributo = base × porcentaje / 100 | `costeo/services.calcular_monto_tributo()` | ✅ Implementado |
| Máquina de estados de importación | `TRANSICIONES_VALIDAS` dict + `cambiar_estado()` | ✅ Implementado |
| Entrada de stock automática al liberar importación | `cambiar_estado()` → `inventario_services.registrar_entrada` por cada detalle | ✅ Implementado |
| `select_for_update` en reserva de stock | `inventario/services._aplicar_movimiento()` | ✅ Implementado |
| Stock nunca negativo | `nuevo_stock < 0` → `ConflictError` con rollback | ✅ Implementado |
| Validación cantidad mínima por modelo en pedidos | `crear_pedido` agrupa por `prenda_id` y compara con `pedido_minimo_modelo` | ✅ Implementado |
| Snapshot de precio al crear DetallePedido | `precio_unitario=variante.precio_unitario` fijado al momento del pedido | ✅ Implementado |
| Devolución de stock al cancelar pedido | `cambiar_estado_pedido` → `inventario_services.registrar_entrada` por detalle | ✅ Implementado |
| Registro de bitácora en operaciones críticas | `auditoria_services.registrar()` en crear/cambiar_estado de importaciones y pedidos | ✅ Implementado |

### 3.3 Autenticación y seguridad

| Requisito | Implementación | Estado |
|-----------|---------------|--------|
| `SessionAuthentication` como único backend | `apps.usuarios.authentication.SessionAuthentication` en `REST_FRAMEWORK` | ✅ |
| Distinción 401/403 correcta | Subclase personalizada con `authenticate_header` | ✅ |
| Cookie CSRF disponible desde el primer request | `@ensure_csrf_cookie` en `MeView.dispatch` | ✅ |
| `LoginView` sin CSRF obligatorio | `permission_classes = [AllowAny]` | ✅ |
| Sin JWT en ningún lugar del código | Búsqueda negativa confirmada | ✅ |
| `CORS_ALLOW_CREDENTIALS = True` | `base.py` | ✅ |

### 3.4 Tests de backend

| App | Líneas de test | Cobertura observada |
|----|---------------|---------------------|
| `usuarios` | 157 | Login, logout, me, permisos por rol |
| `catalogo` | 146 | CRUD prendas/variantes, filtro mayorista, `publicar` |
| `importaciones` | 145 | Crear, CIF auto, cambiar estado, permisos |
| `pedidos` | 156 | Crear pedido, mínimo por modelo, reserva de stock |
| `terceros` | 65 | CRUD básico, filtro propio cliente |
| `costeo` | 68 | `calcular_monto_tributo`, `calcular_costeo` |
| `inventario` | 67 | Entrada/salida, `select_for_update`, stock negativo |
| `documentos` | 65 | CRUD documentos |
| `reportes` | 25 | Cobertura mínima |
| `auditoria` | **3** | ⚠️ Prácticamente vacío |

---

## 4. Análisis del Frontend — React + TypeScript

### 4.1 Infraestructura de integración (implementada)

| Artefacto | Archivo | Estado |
|-----------|---------|--------|
| Cliente API centralizado | `src/services/api.ts` | ✅ `credentials: 'include'`, `X-CSRFToken` automático en mutaciones |
| Servicio de autenticación | `src/services/authService.ts` | ✅ Completo |
| Contexto global de sesión | `src/context/AuthContext.tsx` | ✅ Llama `/api/auth/me/` en mount |
| Hook `useAuth` | `src/hooks/useAuth.ts` | ✅ Completo |
| Rutas protegidas por rol | `src/components/ProtectedRoute.tsx` | ✅ Completo |
| Tipos TypeScript de dominio | `src/types/{auth,catalogo,costeo,importaciones,pedidos,terceros}.ts` | ✅ Todos presentes |

### 4.2 Vistas y módulos de negocio

| Ruta | Componente | Estado real |
|------|-----------|-------------|
| `/login` | `Login.tsx` | ✅ **Funcional** — formulario con manejo de error y submit async |
| `/` | `Dashboard` (inline App.tsx) | ⚠️ **Placeholder mínimo** — muestra usuario, rol y botón de logout |
| `/catalogo` | `ModulePlaceholder` | ❌ No implementado |
| `/importaciones` | `ModulePlaceholder` | ❌ No implementado |
| `/pedidos` | `ModulePlaceholder` | ❌ No implementado |
| `/proveedores` | `ModulePlaceholder` | ❌ No implementado |
| `/documentos` | `ModulePlaceholder` | ❌ No implementado |
| `/costeo` | `ModulePlaceholder` | ❌ No implementado |
| `/tributos` | `ModulePlaceholder` | ❌ No implementado |
| `/tipo-cambio` | `ModulePlaceholder` | ❌ No implementado |
| `/stock` | `ModulePlaceholder` | ❌ No implementado |
| `/reportes` | `ModulePlaceholder` | ❌ No implementado |
| `/usuarios` | `ModulePlaceholder` | ❌ No implementado |
| `/auditoria` | `ModulePlaceholder` | ❌ No implementado |
| `/despachos` | `ModulePlaceholder` | ❌ No implementado |

### 4.3 Estado de componentes UI

| Elemento | Estado |
|----------|--------|
| `shadcn/ui Button` | ✅ Instalado |
| `shadcn/ui Table, Dialog, Form, Input, Select, Badge` | ❌ No instalados |
| Sistema de notificaciones (Toast / Sonner) | ❌ No existe |
| Layout shell (sidebar, header, breadcrumbs) | ❌ `src/layouts/` vacío |
| Tablas de datos paginadas | ❌ No existen |
| Formularios de alta/edición | ❌ No existen |
| Helpers de formateo (precios, fechas, estados) | ❌ `src/utils/` vacío |

---

## 5. Brechas de Implementación (Gaps)

### GAP-1 — Frontend: cero vistas de negocio `[CRÍTICO]`

Todas las rutas excepto `/login` muestran `ModulePlaceholder`. El backend tiene una API REST completa y funcional, pero no existe ninguna pantalla de consumo para Catálogo, Importaciones, Pedidos, Costeo, Inventario, Terceros, Reportes ni Bitácora.

### GAP-2 — Frontend: layout shell ausente `[BLOQUEANTE]`

`src/layouts/` está vacío. Sin un `AppLayout` (sidebar + header + breadcrumbs) es imposible armar las vistas de negocio de forma coherente ni consistente. Esto bloquea toda la Fase 4.

### GAP-3 — Frontend: librería de componentes incompleta

Solo `Button` de shadcn/ui está instalado. Faltan como mínimo: `Table`, `Dialog`, `Form`, `Input`, `Select`, `Badge`, `Toast/Sonner`, `DataTable`, `Card`.

### GAP-4 — Tests de `auditoria` prácticamente vacíos

`auditoria/tests.py` tiene 3 líneas (import vacío). El servicio `auditoria_services.registrar()` es invocado por los servicios de importaciones y pedidos, pero no tiene tests propios que verifiquen que los registros se crean con los campos correctos.

### GAP-5 — Tests de `reportes` mínimos

25 líneas que probablemente solo verifican que el endpoint devuelve 200. No hay tests para los filtros `fecha_desde/fecha_hasta` ni para la correctitud de la agregación.

### GAP-6 — Documentos de sesión ausentes en `docs/`

Los archivos `01-BITACORA_DESARROLLO.md`, `02-SESSION_MEM.md`, `05-FINDINGS_DEUDA.md` y `06-TASK_PLAN.md` referenciados en el protocolo de trabajo (`07-PROMPT_DESARROLLO.md`) no existen en el repositorio.

### GAP-7 — Subida de archivos en `Documento` sin implementar

`Documento.archivo` es un `FileField` declarado y migrado, pero las vistas de `documentos` y el frontend no implementan todavía el upload multipart. El campo existe en la base de datos pero la funcionalidad es un stub.

---

## 6. Resumen Ejecutivo

| Capa | Estado |
|------|--------|
| **Modelos Django (15 modelos + Bitácora)** | ✅ 100% implementados y migrados |
| **Integridad referencial (PROTECT)** | ✅ Cumplida en todas las relaciones maestras |
| **Autenticación por sesión + CSRF** | ✅ Implementada correctamente |
| **Endpoints API v1 (≈20 recursos)** | ✅ Implementados con permisos por rol |
| **Lógica de negocio crítica** | ✅ CIF, costeo, estados, stock atómico, mínimo pedido |
| **Bitácora de auditoría** | ✅ Servicio activo; tests pendientes |
| **Tests de backend** | ✅ Mayoría cubiertos; `auditoria` y `reportes` débiles |
| **Frontend — infraestructura de auth** | ✅ Completa (contexto, cliente API, rutas protegidas) |
| **Frontend — vistas de negocio** | ❌ 0% — todas son `ModulePlaceholder` |
| **Frontend — componentes UI** | ❌ Incompletos (solo `Button` de shadcn/ui) |
| **Frontend — layout shell** | ❌ No existe |

El backend está en condición de integración completa. El frontend tiene la infraestructura de autenticación lista y todos los tipos TypeScript definidos, pero ninguna vista de negocio construida. El trabajo pendiente de mayor volumen está íntegramente en la capa de presentación (Fase 4).
