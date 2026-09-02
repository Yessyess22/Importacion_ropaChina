# Plan de Validaciones Profesionales — Trendy Import SRL
## Fase 6 — Endurecimiento de Datos y Seguridad

**Equipo:** Shirley Yessica Escobar Gutierrez · Oscar Alejandro Segovia Villarreal
**Origen:** checklist de validación profesional (13 puntos) solicitado sobre el estado actual del proyecto tras el cierre de Sprint 4.
**Principio rector:** toda regla se implementa en backend (fuente de verdad) y se refleja en frontend (UX inmediata). Nunca solo frontend.

---

## 1. Diagnóstico de partida

Auditoría de `backend/apps/*/models.py`, `serializers.py`, `views.py` y de los formularios en `frontend/src/pages/**` (2026-09-02):

| # | Checklist | Estado actual | Evidencia |
|---|-----------|---------------|-----------|
| 1 | Texto (nombres, razón social, ciudad) | ❌ Sin regla | `CharField` libre en `terceros/models.py`, `catalogo/models.py`; frontend solo `required` HTML5 |
| 2 | NIT / identificación fiscal | 🔶 Parcial | `unique=True` ya existe; sin formato ni normalización |
| 3 | Teléfono / celular | ❌ Sin regla | `CharField(blank=True)` libre |
| 4 | Email | 🔶 Parcial | DRF valida formato RFC; sin forzar minúsculas |
| 5 | Usuario y contraseña | 🔶 Parcial | `AUTH_PASSWORD_VALIDATORS` solo longitud/común/similitud; sin complejidad ni confirmación en frontend |
| 6 | Campos numéricos | 🔶 Parcial | Tipos correctos (`DecimalField`/`PositiveIntegerField`) pero sin `MinValueValidator` explícito en importaciones/costeo |
| 7 | Fechas | ❌ Sin regla | Sin validación de futuro/pasado ni consistencia |
| 8 | Estados y catálogos | ✅ Resuelto | `TextChoices` + `TRANSICIONES_VALIDAS` en `importaciones`/`pedidos` |
| 9 | Archivos (documentos) | ❌ Sin regla | `Documento.archivo` sin validador de tipo/tamaño/nombre |
| 10 | Integridad relacional | ✅ Resuelto | `PROTECT`/`CASCADE`/`SET_NULL` auditados en `docs/09-AUDITORIA_CODIGO.md` §2.1 |
| 11 | Reglas de negocio clave | ✅ Resuelto | CIF server-side, stock atómico, mínimo por modelo — ver `docs/09-AUDITORIA_CODIGO.md` §3.2 |
| 12 | Auditoría y seguridad | ❌ Sin rate limit | Sin `DEFAULT_THROTTLE_CLASSES` en `REST_FRAMEWORK` (`settings/base.py`) |
| 13 | UX profesional de validación | ❌ Sin resaltado/foco | Sin mapeo de errores DRF → campo en ningún formulario |

**Conclusión:** los puntos 8, 10 y 11 ya están resueltos y solo requieren mantenimiento. El trabajo nuevo se concentra en 1, 2, 3, 4, 5, 6, 7, 9, 12 y 13.

---

## 2. Resumen de Sprints

| Sprint | Nombre | Foco del checklist | Estado |
|--------|--------|--------------------|--------|
| Sprint 5 | Infraestructura transversal de validación | Base para 1–7, 12, 13 | ✅ Cerrado (2026-09-02) |
| Sprint 6 | Terceros + Usuarios | 1, 2, 3, 4, 5 | ✅ Cerrado (2026-09-02) |
| Sprint 7 | Catálogo + Importaciones + Costeo | 6, 7 | ✅ Cerrado (2026-09-02) |
| Sprint 8 | Pedidos + Inventario | 6, 13 (UX de errores de negocio) | ✅ Cerrado (2026-09-02) |
| Sprint 9 | Documentos + Seguridad transversal + UX final | 9, 12, 13 | ✅ Cerrado (2026-09-02) |

---

## Sprint 5 — Infraestructura transversal de validación

**Objetivo:** construir una sola vez los validadores reutilizables (backend y frontend) y el throttling global, para que los Sprints 6–9 solo los apliquen campo por campo sin reinventar regex ni lógica de errores.

### Criterios de aceptación

- [ ] `backend/apps/core/validators.py` existe con validadores de texto, NIT, teléfono y contraseña fuerte, cubiertos por tests unitarios.
- [ ] `REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"]` limita `LoginView` y, en general, las peticiones anónimas/autenticadas.
- [ ] `frontend/src/utils/validators.ts` existe con funciones espejo de las reglas de backend.
- [ ] Un hook/util de frontend mapea `error.response.data` (formato DRF) a errores por campo, resalta el `<Input>` correspondiente y hace foco automático en el primer campo inválido.
- [ ] Ningún formulario existente se rompe (regresión manual mínima en `/proveedores` y `/usuarios`).

### Tareas

| ID | Tarea | Módulo | SP |
|----|-------|--------|----|
| S5-T01 | `backend/apps/core/` (app nueva sin modelos) con `validators.py`: `validar_solo_texto`, `validar_nit`, `normalizar_nit`, `validar_telefono`, `PasswordFuerteValidator` | Backend transversal | 3 |
| S5-T02 | Registrar `PasswordFuerteValidator` en `AUTH_PASSWORD_VALIDATORS` (`settings/base.py`) | Backend transversal | 1 |
| S5-T03 | `DEFAULT_THROTTLE_CLASSES`/`DEFAULT_THROTTLE_RATES` en `REST_FRAMEWORK`, `ScopedRateThrottle` en `LoginView` | Backend transversal | 2 |
| S5-T04 | `frontend/src/utils/validators.ts`: `soloTexto`, `nitValido`, `telefonoValido`, `passwordFuerte`, `emailValido` | Frontend transversal | 3 |
| S5-T05 | `frontend/src/hooks/useFormErrors.ts`: mapea errores DRF (`{campo: [msg]}`) a estado de error por campo + `focusFirstError()` | Frontend transversal | 3 |
| S5-T06 | Tests unitarios de `apps/core/validators.py` (casos válidos/inválidos por función) | Backend transversal | 2 |

**Total SP Sprint 5:** 14

---

## Sprint 6 — Terceros + Usuarios

**Objetivo:** aplicar checklist 1 (texto), 2 (NIT), 3 (teléfono), 4 (email) y 5 (usuario/contraseña) a los módulos con mayor densidad de datos de identificación: `terceros` (Proveedor, ClienteMayorista, AgenteAduanal, Transportista) y `usuarios`.

### Criterios de aceptación

- [x] `razon_social` rechaza dígitos/símbolos raros, se recorta (trim) y colapsa espacios dobles antes de guardar, con largo 2–100.
- [x] `nit` se normaliza (sin espacios/guiones) antes de persistir; el mensaje de duplicado es claro.
- [x] `telefono` solo acepta dígitos y `+` inicial opcional, largo 7–15.
- [x] `email` se guarda siempre en minúsculas.
- [x] Crear/editar Usuario exige contraseña fuerte (backend) y confirmación de contraseña (frontend, antes del submit).
- [x] Los 3 formularios de Terceros expuestos en el frontend (Proveedores, ClientesMayoristas, AgentesAduanales) y el de Usuarios muestran el error debajo del campo específico y hacen foco en el primer campo inválido al fallar el submit.

**Nota:** `Transportista` recibió la misma validación de backend (`TerceroValidationMixin`) pero no tiene página propia en el frontend — no existía antes de este sprint tampoco (ver `docs/09-AUDITORIA_CODIGO.md` §4.2).

### Tareas

| ID | Tarea | Módulo | SP |
|----|-------|--------|----|
| S6-T01 | `validate_razon_social`/`validate_telefono`/`validate_nit`/`validate_email` en `terceros/serializers.py` (los 4 serializers) | Backend `terceros` | 3 |
| S6-T02 | Aplicar `frontend/src/utils/validators.ts` + `useFormErrors` en `Proveedores.tsx`, `ClientesMayoristas.tsx`, `AgentesAduanales.tsx` | Frontend `terceros` | 3 |
| S6-T03 | `UsuarioWriteSerializer.validate_password` (fuerza) + `validate_username` (sin espacios, min 4) | Backend `usuarios` | 2 |
| S6-T04 | Campo "Confirmar contraseña" en el modal de `Usuarios.tsx`, con validación antes de submit | Frontend `usuarios` | 2 |
| S6-T05 | Verificar que los formularios conservan los datos ingresados si el submit falla (no se limpia el modal) | Frontend `terceros`+`usuarios` | 2 |

**Total SP Sprint 6:** 12

---

## Sprint 7 — Catálogo + Importaciones + Costeo

**Objetivo:** checklist 6 (numéricos) y 7 (fechas) sobre los módulos con montos y fechas de negocio: `catalogo`, `importaciones`, `costeo`.

### Criterios de aceptación

- [x] `VarianteProducto.precio_unitario` rechaza valores ≤ 0 (backend y frontend).
- [x] `OperacionImportacion.valor_fob/flete/seguro` rechazan negativos; `fecha_registro` no admite fechas futuras.
- [x] `TipoCambio.valor` rechaza ≤ 0; `TipoCambio.fecha` no admite fechas futuras.
- [x] `Tributo.porcentaje` queda acotado a 0–100 (y `base_imponible` no admite negativos).
- [x] Los formularios `NuevaImportacion.tsx`, `TipoCambio.tsx` y `Costeo.tsx` bloquean el submit con mensaje específico antes de llamar a la API (validación en tiempo real) y igual la rechazan si llega al backend.

**Extras incluidos sobre el alcance original:** `DetalleImportacion.cantidad` (mínimo 1) y `costo_unitario_fob` (mínimo 0.01) también reciben `MinValueValidator`, por ser los mismos campos "FOB/cantidades" del checklist #6 y no tener ninguna protección previa.

### Tareas

| ID | Tarea | Módulo | SP |
|----|-------|--------|----|
| S7-T01 | `MinValueValidator(Decimal("0.01"))` en `VarianteProducto.precio_unitario` + migración | Backend `catalogo` | 2 |
| S7-T02 | `MinValueValidator(0)` en `valor_fob/flete/seguro` + `validate_fecha_registro` (no futura) en `importaciones/serializers.py` | Backend `importaciones` | 3 |
| S7-T03 | `MinValueValidator`/`MaxValueValidator` en `TipoCambio.valor` y `Tributo.porcentaje`; `validate_fecha` en `TipoCambioSerializer` | Backend `costeo` | 2 |
| S7-T04 | Validación en tiempo real de montos/fechas en `NuevaImportacion.tsx`, `TipoCambio.tsx`, `Costeo.tsx` | Frontend | 3 |

**Total SP Sprint 7:** 10

---

## Sprint 8 — Pedidos + Inventario

**Objetivo:** checklist 6 (cantidades) ya está mayormente cubierto por `services.py` (mínimo por modelo, stock atómico); este sprint es UX de checklist 13 — traducir los `ConflictError` de negocio en mensajes claros por campo, no en toasts genéricos.

### Criterios de aceptación

- [x] Al pedir menos que el mínimo por modelo, el error se muestra junto a la línea del carrito afectada (texto "— faltan N" en rojo) y como banner persistente, no solo en un toast.
- [x] Al no haber stock suficiente, el mensaje indica la variante y la cantidad disponible.
- [x] `AjustarStockSerializer` rechaza `delta = 0`. `RegistrarMovimientoSerializer.cantidad` ya tenía `min_value=1` desde antes de este sprint (equivalente a "≠ 0" sin negativos), no requirió cambio.

**Corrección de alcance sobre el plan original:** `Stock.tsx` es una vista de solo lectura (listado + historial de movimientos) — no existe ningún formulario en el frontend que llame a las acciones `entrada`/`salida`/`ajuste` del backend. El único punto donde un usuario real puede disparar "stock insuficiente" hoy es `NuevoPedido.tsx` (vía `crear_pedido` → `inventario_services.registrar_salida`), así que S8-T01 y S8-T02 se resolvieron ambos ahí. El mensaje de `ConflictError` en `inventario/services._aplicar_movimiento` se enriqueció con la variante y las cantidades disponible/solicitada — beneficia a `NuevoPedido.tsx` hoy y a cualquier futura UI de ajuste de stock sin cambios adicionales.

### Tareas

| ID | Tarea | Módulo | SP |
|----|-------|--------|----|
| S8-T01 | Banner persistente + indicador "faltan N" por línea en `NuevoPedido.tsx` (se mantiene el toast existente, contrato de `tests/pedidos.spec.ts`) | Frontend `pedidos` | 3 |
| S8-T02 | Enriquecer el mensaje de `ConflictError` en `inventario/services._aplicar_movimiento` con variante + disponible/solicitado | Backend `inventario` | 2 |
| S8-T03 | `validate_delta` (≠ 0) en `AjustarStockSerializer` | Backend `inventario` | 1 |

**Total SP Sprint 8:** 6

---

## Sprint 9 — Documentos + Seguridad transversal + UX final

**Objetivo:** checklist 9 (archivos), 12 (auditoría/seguridad) y cierre de 13 (UX) en el resto de formularios no cubiertos en Sprints 6–8.

### Criterios de aceptación

- [x] `Documento.archivo` rechaza extensiones fuera de `.pdf/.jpg/.jpeg/.png` y archivos > 10 MB, con nombre saneado antes de guardar.
- [x] Login limitado por `ScopedRateThrottle` (verificado con prueba manual de 22 intentos fallidos seguidos vía `curl`, y con la suite E2E completa corriendo en paralelo).
- [x] Ningún mensaje de error de la API expone stack trace, SQL o nombres de campos internos fuera de los serializers (`DEBUG=False` en `settings/production.py`; ningún `raise Exception`/`raise ValueError` crudo en `services.py`/`views.py`, todo pasa por `ConflictError`).
- [x] Todos los formularios restantes (`NuevaImportacion`, `Costeo`, `TipoCambio` — ya cubiertos en Sprint 7 — y `Documentos`) resaltan el campo con error y hacen foco automático.

**Hallazgo durante S9-T02 (corrección de alcance):** la tasa de `10/min` fijada en Sprint 5 para el scope `login` resultó demasiado estricta al correr la suite E2E completa en paralelo (varios logins legítimos en la misma ventana de un minuto) — devolvía `429` a intentos válidos. `ScopedRateThrottle` limita por IP, no por cuenta, así que un valor bajo también golpearía a varios empleados de una misma oficina (NAT) iniciando sesión casi a la vez. Se subió a `20/min` en `settings/base.py`, verificado en dos frentes: (1) la suite E2E completa (12 tests, 4 workers) pasa sin falsos 429; (2) 22 intentos consecutivos desde la misma IP siguen bloqueándose a partir del límite.

**Gaps residuales encontrados en el QA final (S9-T05) y corregidos en el momento:**
- `UsuarioWriteSerializer` no bajaba a minúsculas el email (sí lo hacía `TerceroValidationMixin` desde Sprint 6) — corregido con `validate_email`.
- `Documento.fecha_emision` no rechazaba fechas futuras — corregido con `validate_fecha_emision` reutilizando `validar_fecha_no_futura`.

**Gaps residuales conscientemente fuera de alcance (ver `docs/05-FINDINGS_DEUDA.md` GAP-16):**
- Checklist #1 (solo texto) no se aplicó a `Prenda.nombre/categoria/temporada/coleccion` (catálogo): a diferencia de una razón social, un nombre de modelo de ropa legítimamente incluye números y símbolos (ej. "Vestido Casual 2026", "Blusa 3/4"), así que la regla "solo letras" no aplica a ese dominio sin cambiar su naturaleza.
- Checklist #12 no agregó registro en `Bitacora` para intentos de login fallidos — el alcance actual de auditoría son operaciones de negocio (crear/cambiar-estado de importaciones y pedidos), y sumar eventos de autenticación es una ampliación de alcance, no un endurecimiento de una regla ya definida.
- `Transportista` recibió la misma validación de backend que los demás `Tercero` (Sprint 6) pero sigue sin página propia en el frontend — no existía antes de este trabajo tampoco.

### Tareas

| ID | Tarea | Módulo | SP |
|----|-------|--------|----|
| S9-T01 | `validate_archivo` (extensión + tamaño) en `documentos/serializers.py`; sanear `nombre` con `django.utils.text.get_valid_filename` | Backend `documentos` | 3 |
| S9-T02 | Prueba manual de throttling + corrección de `THROTTLE_RATES["login"]` (10/min → 20/min) | Backend transversal | 2 |
| S9-T03 | Revisión de `config/exceptions.py`/`settings/production.py` — confirmado sin cambios de código necesarios | Backend transversal | 1 |
| S9-T04 | Aplicar `useFormErrors` + validación de archivo en tiempo real a `Documentos.tsx` | Frontend `documentos` | 2 |
| S9-T05 | QA final de los 13 puntos del checklist; 2 gaps residuales encontrados y corregidos (`Usuario.email`, `Documento.fecha_emision`); actualización de `docs/05-FINDINGS_DEUDA.md` | Ambos | 3 |

**Total SP Sprint 9:** 11

---

## 3. Matriz de trazabilidad checklist → módulo

| Checklist | terceros | usuarios | catalogo | importaciones | costeo | pedidos | inventario | documentos |
|-----------|----------|----------|----------|---------------|--------|---------|------------|------------|
| 1. Texto | Sprint 6 | Sprint 6 | — | — | — | — | — | — |
| 2. NIT | Sprint 6 | — | — | — | — | — | — | — |
| 3. Teléfono | Sprint 6 | — | — | — | — | — | — | — |
| 4. Email | Sprint 6 | Sprint 6 | — | — | — | — | — | — |
| 5. Usuario/contraseña | — | Sprint 6 | — | — | — | — | — | — |
| 6. Numéricos | — | — | Sprint 7 | Sprint 7 | Sprint 7 | ✅ (services) | ✅ (services) | — |
| 7. Fechas | — | — | — | Sprint 7 | Sprint 7 | — | — | — |
| 8. Estados/catálogos | — | — | ✅ | ✅ | — | ✅ | — | — |
| 9. Archivos | — | — | — | — | — | — | — | Sprint 9 |
| 10. Integridad relacional | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 11. Reglas de negocio | — | — | — | ✅ | ✅ | ✅ | ✅ | — |
| 12. Auditoría/seguridad | Sprint 9 (transversal) | | | | | | | |
| 13. UX validación | Sprint 6 | Sprint 6 | Sprint 7 | Sprint 7/9 | Sprint 7/9 | Sprint 8 | Sprint 8 | Sprint 9 |

---

## 4. Notas de implementación

- **No romper contratos existentes.** `valor_cif`, `costo_total`, `monto` (Tributo), `stock_disponible` y `estado` de `VarianteProducto` siguen siendo campos calculados por servicio, nunca abiertos a escritura directa por estas validaciones.
- **Normalización vs. validación.** NIT y teléfono se normalizan (se limpia formato) en `validate()`/`create()`/`update()` del serializer, no con una migración de datos retroactiva — los registros existentes no se tocan salvo que se edite ese Tercero.
- **No añadir un `form` de shadcn.** `docs/05-FINDINGS_DEUDA.md` (GAP-3) ya registró que el componente `form` no existe en el registro `base-nova`; el patrón de error por campo se construye sobre `Input`/`Label` nativos + `useFormErrors`, consistente con lo ya usado en el proyecto.

---

## 5. Estado final del checklist (cierre de Fase 6)

| # | Checklist | Estado final |
|---|-----------|--------------|
| 1 | Texto | ✅ `terceros` (4 subtipos) + `usuarios`. No aplica a `catalogo` (nombres de producto admiten números) |
| 2 | NIT | ✅ Formato + normalización + unicidad sobre valor normalizado |
| 3 | Teléfono | ✅ Formato + normalización |
| 4 | Email | ✅ Minúsculas en `terceros` y `usuarios` |
| 5 | Usuario/contraseña | ✅ Fuerza (backend, vía `AUTH_PASSWORD_VALIDATORS`) + confirmación (frontend) + username mínimo |
| 6 | Numéricos | ✅ `MinValueValidator`/`MaxValueValidator` en catálogo, importaciones, costeo; pedidos/inventario ya lo tenían |
| 7 | Fechas | ✅ `validar_fecha_no_futura` en importaciones, costeo y documentos |
| 8 | Estados/catálogos | ✅ Ya resuelto antes de este trabajo (`TextChoices` + máquinas de estado) |
| 9 | Archivos | ✅ Extensión, tamaño y nombre saneado en `Documento.archivo` |
| 10 | Integridad relacional | ✅ Ya resuelto antes de este trabajo (`PROTECT`/`CASCADE`/`SET_NULL` auditados) |
| 11 | Reglas de negocio | ✅ Ya resuelto antes de este trabajo (CIF, stock atómico, mínimo por modelo) |
| 12 | Auditoría/seguridad | ✅ Rate limiting (throttle scoped `login`), sin fuga de detalles internos verificada |
| 13 | UX de validación | ✅ Tiempo real + backend, error por campo, foco automático, datos conservados al fallar, en los 8 formularios de escritura del frontend |

Los 13 puntos del checklist quedan resueltos o explícitamente fuera de alcance con justificación (ver GAP-16 en `docs/05-FINDINGS_DEUDA.md`). 142 tests de backend y toda la suite E2E de Playwright pasan en verde al cierre de este trabajo.
