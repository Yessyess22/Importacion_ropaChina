# Especificación de Requerimientos — Trendy Import SRL

**Versión:** 1.0 | **Última actualización:** 2026-08-30

---

## 1. Casos de Uso (CU-01 al CU-13)

### CU-01: Iniciar Sesión

| Campo | Descripción |
|-------|-------------|
| **Actor principal** | Cualquier usuario del sistema |
| **Precondición** | El usuario existe en la base de datos con un rol asignado |
| **Flujo normal** | 1. El usuario accede a `/login`. 2. Ingresa nombre de usuario y contraseña. 3. El sistema valida credenciales contra Django Auth. 4. Se crea una sesión y se fija la cookie `sessionid` HttpOnly. 5. El sistema redirige al dashboard según el rol. |
| **Flujo alternativo** | Si las credenciales son incorrectas → se muestra un Toast de error. Sin redirección ni exposición del motivo exacto del fallo. |
| **Postcondición** | Sesión activa; cookie `csrftoken` accesible para mutaciones subsiguientes. |

---

### CU-02: Gestionar Catálogo de Prendas

| Campo | Descripción |
|-------|-------------|
| **Actor principal** | Administrador, Operador de Comercio Exterior |
| **Precondición** | Sesión activa con rol autorizado |
| **Flujo normal** | 1. El operador accede a `/catalogo`. 2. Visualiza la lista de prendas paginada. 3. Puede crear, editar o desactivar una prenda. 4. Cada prenda puede tener múltiples variantes (talla/color). |
| **Flujo alternativo** | Cliente Mayorista solo ve prendas `activo=True` con al menos una variante en estado `PUBLICADO`. |
| **Postcondición** | Catálogo actualizado en base de datos; variantes en estado `BORRADOR` hasta ser publicadas. |

---

### CU-03: Publicar Variante de Producto

| Campo | Descripción |
|-------|-------------|
| **Actor principal** | Administrador, Operador de Comercio Exterior |
| **Precondición** | La operación de importación vinculada está en estado `LIBERADA` |
| **Flujo normal** | 1. El operador selecciona una variante en estado `BORRADOR`. 2. Ejecuta la acción `publicar`. 3. El sistema cambia el estado a `PUBLICADO` de forma atómica. |
| **Flujo alternativo** | Si la variante ya está publicada o descontinuada → error 409. |
| **Postcondición** | La variante es visible para los Clientes Mayoristas. |

---

### CU-04: Registrar Proveedor

| Campo | Descripción |
|-------|-------------|
| **Actor principal** | Administrador, Operador de Comercio Exterior |
| **Precondición** | Sesión activa con rol autorizado |
| **Flujo normal** | 1. El operador accede a `/proveedores`. 2. Completa el formulario con razón social, NIT, país de origen, fábrica. 3. El sistema guarda el proveedor. |
| **Flujo alternativo** | NIT duplicado → error de validación 400 Bad Request. |
| **Postcondición** | Proveedor disponible para asociar a operaciones de importación. |

---

### CU-05: Registrar Cliente Mayorista

| Campo | Descripción |
|-------|-------------|
| **Actor principal** | Administrador |
| **Precondición** | Sesión activa con rol Administrador |
| **Flujo normal** | 1. El administrador crea el registro de cliente con razón social, NIT y cantidad mínima de pedido por modelo. 2. Opcionalmente vincula una cuenta de usuario del sistema. |
| **Flujo alternativo** | NIT duplicado → error 400. Cuenta de usuario ya vinculada a otro cliente → error 400. |
| **Postcondición** | Cliente activo y disponible para realizar pedidos. |

---

### CU-06: Registrar Operación de Importación

| Campo | Descripción |
|-------|-------------|
| **Actor principal** | Administrador, Operador de Comercio Exterior |
| **Precondición** | Al menos un Proveedor registrado |
| **Flujo normal** | 1. El operador accede a `/importaciones` → Nueva Operación. 2. Ingresa proveedor, fechas, valor FOB, flete y seguro. 3. El backend calcula automáticamente el `valor_cif = FOB + flete + seguro`. 4. Agrega las líneas de detalle (variante, cantidad, costo unitario FOB). 5. El sistema registra la operación en estado `REGISTRADA`. |
| **Flujo alternativo** | Si falta algún campo obligatorio → error 400 con detalle de campo. |
| **Postcondición** | Operación en estado `REGISTRADA`; CIF persistido en base de datos. |
| **Restricción** | El frontend NUNCA calcula ni envía `valor_cif`. Es responsabilidad exclusiva del backend. |

---

### CU-07: Gestionar Despacho Aduanero (Transición de Estado)

| Campo | Descripción |
|-------|-------------|
| **Actor principal** | Operador de Comercio Exterior, Agente Aduanal, Administrador |
| **Precondición** | Operación de importación existente en un estado válido de origen |
| **Flujo normal** | 1. El agente aduanal accede a la operación. 2. Selecciona la transición de estado deseada. 3. El backend valida que la transición sea permitida. 4. Al llegar a `LIBERADA`, el sistema genera automáticamente entradas de stock (`MovimientoInventario`) para cada variante del detalle. |
| **Flujo alternativo** | Transición inválida (ej. `LIBERADA → EN_TRANSITO`) → error 409 Conflict. |
| **Postcondición** | Operación en nuevo estado; stock actualizado si se liberó. |
| **Transiciones válidas** | `REGISTRADA` → `EN_TRANSITO` → `EN_ADUANA` → `LIBERADA`. Desde cualquier estado previo a LIBERADA se puede ir a `CANCELADA`. |

---

### CU-08: Registrar Costeo y Tributos de Importación

| Campo | Descripción |
|-------|-------------|
| **Actor principal** | Contabilidad, Administrador |
| **Precondición** | Operación de importación existente con `valor_cif` calculado |
| **Flujo normal** | 1. El contador accede al módulo de costeo de la operación. 2. Registra los tributos (Arancel, IVA) con base imponible y porcentaje. 3. El backend calcula el monto: `base_imponible × porcentaje / 100`. 4. El contador ejecuta `calcular-costeo` para obtener el costo total de nacionalización. |
| **Flujo alternativo** | Si no hay `TipoCambio` registrado para la fecha → el sistema alerta al usuario. |
| **Postcondición** | `Costeo.costo_total` actualizado = `valor_cif + Σ tributos`. |

---

### CU-09: Registrar Pedido Mayorista

| Campo | Descripción |
|-------|-------------|
| **Actor principal** | Cliente Mayorista, Administrador, Operador de Comercio Exterior |
| **Precondición** | El cliente tiene cuenta activa; existen variantes en estado `PUBLICADO` con stock disponible |

#### Flujo Normal

1. El Cliente Mayorista accede a `/pedidos` → Nuevo Pedido.
2. El sistema muestra el catálogo de variantes publicadas filtrado para su rol.
3. El cliente selecciona variantes (talla/color) y especifica la cantidad para cada una.
4. El cliente confirma el pedido.
5. El backend, dentro de una única transacción atómica:
   a. Agrupa las líneas de detalle por `Prenda` matriz.
   b. Suma las cantidades por modelo y las compara contra `ClienteMayorista.pedido_minimo_modelo`.
   c. Si todos los modelos cumplen el mínimo, bloquea las filas de `VarianteProducto` con `SELECT FOR UPDATE`.
   d. Verifica que el stock disponible sea suficiente para cada variante.
   e. Descuenta el stock y registra un `MovimientoInventario` de tipo `SALIDA` por cada línea.
   f. Crea el `PedidoMayorista` con código único y cada `DetallePedido` con el precio snapshot.
   g. Registra la operación en la `Bitacora`.
6. El sistema responde con el pedido creado en estado `PENDIENTE`.
7. El frontend muestra un Toast de confirmación con el código del pedido.

#### Flujo Alternativo A — Cantidad mínima incumplida

- En el paso 5b, si algún modelo tiene cantidad total < `pedido_minimo_modelo`:
  - El backend realiza un rollback completo de la transacción.
  - Devuelve HTTP 409 Conflict con el mensaje: *"La cantidad mínima por modelo es N unidades; uno de los modelos del pedido tiene solo M."*
  - El frontend muestra el error en un Toast de tipo destructivo. **No se crea el pedido, no se reserva stock parcial.**

#### Flujo Alternativo B — Stock insuficiente

- En el paso 5d, si alguna variante no tiene stock suficiente:
  - El backend realiza un rollback completo.
  - Devuelve HTTP 409 Conflict: *"Stock insuficiente para esta operación."*
  - El frontend muestra el error y sugiere ajustar las cantidades.

#### Flujo Alternativo C — Cliente sin cuenta vinculada (creación por staff)

- Un Administrador u Operador puede crear pedidos en nombre de cualquier cliente seleccionando el `cliente_id` en el payload.
- Si el `cliente_id` no se especifica para un rol de staff → HTTP 400 Bad Request.

| **Postcondición** | Pedido en estado `PENDIENTE`; stock reservado; registro en `Bitacora`. |

---

### CU-10: Gestionar Documentos de Importación

| Campo | Descripción |
|-------|-------------|
| **Actor principal** | Agente Aduanal, Administrador |
| **Flujo normal** | 1. El agente accede a los documentos de una operación. 2. Sube un archivo (Factura, BL, Packing List, Certificado de Origen). 3. El sistema almacena el archivo en `media/documentos/YYYY/MM/`. |
| **Flujo alternativo** | Tipo de documento no reconocido → error 400. |
| **Postcondición** | Documento vinculado a la operación y accesible para descarga. |

---

### CU-11: Consultar Inventario y Movimientos de Stock

| Campo | Descripción |
|-------|-------------|
| **Actor principal** | Administrador, Operador, Contabilidad, Agente Aduanal, Cliente Mayorista |
| **Flujo normal** | 1. El usuario accede a `/stock`. 2. Visualiza el stock disponible por variante con filtros de prenda/talla/color. 3. Puede consultar el historial de movimientos (entradas, salidas, ajustes) filtrados por variante. |
| **Flujo alternativo** | El Cliente Mayorista solo ve variantes publicadas; no puede ver costos de importación ni movimientos detallados. |

---

### CU-12: Generar Reporte de Importaciones y Pedidos

| Campo | Descripción |
|-------|-------------|
| **Actor principal** | Administrador, Operador de Comercio Exterior, Contabilidad |
| **Flujo normal** | 1. El usuario accede a `/reportes`. 2. Selecciona el tipo de reporte (Importaciones o Pedidos). 3. Aplica filtros opcionales (rango de fechas, estado, cliente). 4. El sistema devuelve datos agregados (conteo por estado, valor CIF total). |
| **Postcondición** | Datos presentados en gráfico de barras y tabla exportable. |

---

### CU-13: Consultar Bitácora de Auditoría

| Campo | Descripción |
|-------|-------------|
| **Actor principal** | Administrador |
| **Flujo normal** | 1. El administrador accede a `/auditoria`. 2. Visualiza los registros de la bitácora paginados y ordenados por fecha descendente. 3. Puede filtrar por acción, usuario o entidad afectada. |
| **Restricción** | Solo rol Administrador. Ningún otro rol puede leer la bitácora. |

---

## 2. Requerimientos Funcionales (RF-01 al RF-16)

| ID | Módulo | Descripción |
|----|--------|-------------|
| **RF-01** | Catálogo | El sistema debe gestionar un catálogo de `Prenda` con variantes únicas por combinación de talla y color (`VarianteProducto`). |
| **RF-02** | Terceros | El sistema debe registrar y gestionar `Proveedor`, `ClienteMayorista`, `AgenteAduanal` y `Transportista` como entidades independientes. |
| **RF-03** | Importaciones | El sistema debe registrar `OperacionImportacion` con los valores FOB, flete y seguro. |
| **RF-04** | Importaciones | El sistema debe calcular automáticamente `valor_cif = FOB + flete + seguro` en el backend; el cliente HTTP no puede enviarlo. |
| **RF-05** | Costeo | El sistema debe calcular tributos como `monto = base_imponible × porcentaje / 100` y el costeo total como `CIF + Σ tributos`. |
| **RF-06** | Documentos | El sistema debe permitir adjuntar documentos (Factura, BL, Packing List, Certificado de Origen) a una operación de importación. |
| **RF-07** | Importaciones | El sistema debe implementar una máquina de estados estricta: `REGISTRADA → EN_TRANSITO → EN_ADUANA → LIBERADA` (y `CANCELADA`). |
| **RF-08** | Catálogo | Al liberar una importación, el sistema debe publicar automáticamente las variantes asociadas actualizando su estado a `PUBLICADO`. |
| **RF-09** | Inventario | Al liberar una importación, el sistema debe registrar entradas de stock por cada variante del detalle mediante `MovimientoInventario`. |
| **RF-10** | Costeo | El sistema debe registrar el tipo de cambio diario USD/BOB para convertir valores en reportes. |
| **RF-11** | Reportes | El sistema debe generar reportes agregados de importaciones (por estado, valor CIF total) y pedidos (por estado) con filtros de fecha. |
| **RF-12** | Autenticación | El sistema debe autenticar usuarios mediante sesión Django con cookies HttpOnly. No se permite JWT. |
| **RF-13** | Autorización | El sistema debe implementar 5 roles con accesos diferenciados: Administrador, Operador, Agente Aduanal, Contabilidad, Cliente Mayorista. |
| **RF-14** | Catálogo | El Cliente Mayorista solo debe ver prendas `activo=True` con variantes en estado `PUBLICADO`. |
| **RF-15** | Pedidos | Al crear un pedido, el sistema debe validar que la cantidad total por modelo sea ≥ `ClienteMayorista.pedido_minimo_modelo`. |
| **RF-16** | Pedidos | La reserva de stock debe ser atómica (usando `SELECT FOR UPDATE`): stock nunca queda negativo; no hay reservas parciales. |

---

## 3. Requerimientos No Funcionales (RNF-01 al RNF-11)

| ID | Categoría | Descripción |
|----|-----------|-------------|
| **RNF-01** | Seguridad | Todas las cookies de sesión deben ser `HttpOnly` y `SameSite=Lax`. La cookie `csrftoken` debe ser accesible por JavaScript solo para leer el token. |
| **RNF-02** | Seguridad | El sistema no debe exponer contraseñas, hashes ni tokens en ninguna respuesta de la API. |
| **RNF-03** | Integridad | Las claves foráneas sobre entidades maestras de negocio deben usar `on_delete=models.PROTECT`. Queda prohibido `on_delete=models.CASCADE` en esas relaciones. |
| **RNF-04** | Rendimiento | Las consultas de listado deben usar `select_related` / `prefetch_related` para evitar el problema N+1. El tamaño de página por defecto es 20 registros. |
| **RNF-05** | Concurrencia | Las operaciones de reserva y liberación de stock deben ejecutarse dentro de transacciones atómicas con `SELECT FOR UPDATE` para prevenir condiciones de carrera. |
| **RNF-06** | Mantenibilidad | La lógica de negocio (cálculos, validaciones, transiciones de estado) debe residir exclusivamente en archivos `services.py`. Las vistas son controladores de transporte. |
| **RNF-07** | Calidad | Toda lógica de negocio crítica del backend debe tener al menos un test unitario o integrado antes de ser fusionada a `dev`. |
| **RNF-08** | Usabilidad | El frontend no puede usar `window.alert()`, `window.confirm()` ni `window.prompt()`. Las notificaciones usan Toasts; las confirmaciones destructivas usan modales accesibles. |
| **RNF-09** | Consistencia visual | El frontend usa exclusivamente clases utilitarias de Tailwind CSS v4. Queda prohibido el uso de estilos CSS inline o valores arbitrarios no definidos en el sistema de diseño. |
| **RNF-10** | Datos dinámicos | Ningún valor de negocio (precios, stocks, catálogos, roles) puede estar codificado de forma estática en el frontend. Toda información debe consumirse desde `/api/v1/`. |
| **RNF-11** | Trazabilidad | Las operaciones críticas (crear importación, cambiar estado, crear pedido) deben registrarse en la `Bitacora` con el usuario, la acción y el detalle relevante. |
