# Base de datos y modelos Django — Fase 2

Este documento describe el esquema de datos implementado en la Fase 2 del
proyecto **Trendy Import SRL**, basado en el documento académico
"ACTIVIDAD 5 — Diseño de Sistemas de Software". Cubre entidades, relaciones,
decisiones de diseño y cómo operar la base de datos.

## 1. Aplicaciones y entidades

| App | Modelos | Responsabilidad |
|---|---|---|
| `usuarios` | `Usuario` (AbstractUser), `Rol` | Autenticación y rol de negocio |
| `terceros` | `Tercero` (abstracta), `Proveedor`, `ClienteMayorista`, `AgenteAduanal`, `Transportista` | Personas/empresas con las que interactúa el sistema |
| `catalogo` | `Prenda`, `VarianteProducto` | Modelos de prenda y sus combinaciones talla/color |
| `importaciones` | `OperacionImportacion`, `DetalleImportacion` | Operaciones de importación y las variantes que ingresan en cada una |
| `documentos` | `Documento` | Factura, BL, packing list, certificado de origen |
| `costeo` | `Costeo`, `Tributo`, `TipoCambio` | CIF, tributos (arancel/IVA) y tipo de cambio diario |
| `inventario` | `MovimientoInventario` | Trazabilidad de entradas/salidas/ajustes de stock |
| `pedidos` | `PedidoMayorista`, `DetallePedido` | Pedidos B2B de clientes mayoristas |
| `reportes` | — | Sin modelos propios; consulta datos de otras apps (fase futura) |
| `auditoria` | `Bitacora` | Registro de acciones críticas del sistema |

No existe una app `core` con todos los modelos: cada entidad vive en la app
de su dominio, siguiendo la modularización pedida para el proyecto.

## 2. Diagrama de relaciones

```
Prenda (1) ── (N) VarianteProducto
VarianteProducto (1) ── (N) DetalleImportacion (N) ── (1) OperacionImportacion
VarianteProducto (1) ── (N) MovimientoInventario
VarianteProducto (1) ── (N) DetallePedido (N) ── (1) PedidoMayorista (N) ── (1) ClienteMayorista

Proveedor (1) ── (N) OperacionImportacion
OperacionImportacion (1) ── (N) Documento
OperacionImportacion (1) ── (1) Costeo (1) ── (N) Tributo
OperacionImportacion (N) ── (1) AgenteAduanal   [opcional]
OperacionImportacion (N) ── (1) Transportista   [opcional]

Usuario (N) ── (1) Rol
Usuario (1) ── (1) ClienteMayorista   [opcional, login del portal mayorista]
Usuario (1) ── (N) Bitacora           [SET_NULL]
```

## 3. Decisiones de diseño

### 3.1 `Tercero` como clase abstracta (no herencia multi-tabla)
`Proveedor`, `ClienteMayorista`, `AgenteAduanal` y `Transportista` heredan
en Python de una clase `Tercero` con `abstract = True`. Cada uno obtiene su
propia tabla completa (sin JOIN adicional, sin columnas nulas ajenas a su
dominio), y los campos comunes (`razon_social`, `nit`, `telefono`, `email`,
`direccion`, `activo`) se definen una sola vez a nivel de código.

### 3.2 `DetalleImportacion` como tabla intermedia
El diagrama conceptual sugiere `VarianteProducto (N) — (1) OperacionImportacion`,
pero eso ataría cada variante a una única importación para siempre. En la
práctica una variante (talla/color) puede reabastecerse en importaciones
distintas, y una operación trae múltiples variantes. Se resuelve con
`DetalleImportacion` (N:N real, con `cantidad` y `costo_unitario_fob`),
igual que `DetallePedido` resuelve `PedidoMayorista`↔`VarianteProducto`.

### 3.3 Usuario y Rol
`Usuario` extiende `AbstractUser` (no se reimplementa autenticación:
contraseñas, sesiones y permisos base los sigue manejando Django). `Rol` es
una tabla propia —no `TextChoices`— porque el documento la define como
entidad independiente y debe poder administrarse desde el Admin sin
despliegue de código. La autorización fina (qué puede hacer cada rol) se
mapeará en Fase 3 a `Group`/`Permission` de Django.

### 3.4 Stock
`VarianteProducto.stock_disponible` es un contador persistido (lectura
rápida para catálogo). `MovimientoInventario` es el ledger de trazabilidad
(entradas/salidas/ajustes) que respalda ese contador. El servicio que
mantiene ambos sincronizados se implementará en una fase posterior; esta
fase solo define la estructura.

### 3.5 `valor_cif` y `costo_total`
Son campos **persistidos**, no propiedades calculadas en Python, para poder
filtrarlos/ordenarlos en reportes (RF-11) directamente en SQL. Se
actualizan exclusivamente mediante un servicio (fase futura) a partir de
`valor_fob + valor_flete + valor_seguro`, nunca editados a mano. `Costeo` no
repite FOB/Flete/Seguro/CIF (ya están en `OperacionImportacion`) para evitar
datos duplicados que puedan desincronizarse.

### 3.6 Cantidad mínima por modelo
`ClienteMayorista.pedido_minimo_modelo` se mantiene tal como lo define el
documento fuente (mínimo por cliente, aplicable a cada modelo distinto en
un pedido). La validación en sí (sumar cantidades por `Prenda` dentro de un
pedido y compararlas contra este valor) se implementará en la capa de
servicios, no en esta fase.

### 3.7 Estados
Se usan `TextChoices` de Django (no tablas de catálogo ni enums de
PostgreSQL) en `OperacionImportacion.estado`, `PedidoMayorista.estado`,
`VarianteProducto.estado`, `Documento.tipo` y `Tributo.tipo`: simples,
versionados junto al código y suficientes para esta escala.

### 3.8 Claves primarias y códigos de negocio
Todas las tablas usan `BigAutoField` (id técnico autoincremental) como PK,
de forma consistente. Los códigos de negocio (`codigo_modelo`,
`codigo_unico`, `codigo_pedido`, `nit`) son `CharField(unique=True)`
independientes de la PK: las FKs siempre apuntan al `id`, nunca al código.

### 3.9 Dinero y tipo de cambio
Todo valor monetario usa `DecimalField` (nunca `FloatField`):
- FOB, flete, seguro, CIF, costo total, montos de tributo, base imponible: `max_digits=12, decimal_places=2`.
- Precio unitario: `max_digits=10, decimal_places=2`.
- Porcentaje de tributo: `max_digits=5, decimal_places=2`.
- Tipo de cambio: `max_digits=6, decimal_places=4` (más precisión que el dinero final).

`TipoCambio` no tiene campos `moneda_origen`/`moneda_destino`: el proyecto
solo requiere USD/BOB (RF-10); agregarlos sería generalización no
solicitada. `TipoCambio.fecha` es `unique` para evitar más de un registro
ambiguo por día.

### 3.10 Integridad referencial (`on_delete`)
- `PROTECT` en FKs hacia entidades maestras referenciadas por historial
  transaccional (`Proveedor`, `ClienteMayorista`, `VarianteProducto`,
  `Prenda` vía variante, `AgenteAduanal`, `Transportista`, `Rol`): nunca se
  borran físicamente; se desactivan con `activo=False`.
- `CASCADE` solo en relaciones "detalle de" sin sentido fuera de su padre
  (`DetallePedido`, `DetalleImportacion`, `Tributo`, `Documento`, `Costeo`).
- `SET_NULL` en `Bitacora.usuario`: el log de auditoría debe sobrevivir
  aunque se elimine la cuenta; se complementa con `usuario_repr` (snapshot
  de texto) para mantener legibilidad.

### 3.11 Auditoría genérica
`Bitacora` y `MovimientoInventario.origen` usan el framework de
`contenttypes` de Django (`GenericForeignKey`) para referenciar cualquier
modelo del sistema, en vez de un `CharField` libre con el nombre de la
entidad (evita errores de tipeo y mantiene una referencia real).

### 3.12 Precio histórico en pedidos
`DetallePedido.precio_unitario` es un snapshot al momento de la compra (no
una referencia al precio vigente de `VarianteProducto`): si el precio
cambia después, los pedidos ya realizados no deben recalcularse.

### 3.13 Vínculo Usuario ↔ ClienteMayorista
`ClienteMayorista.usuario` es un `OneToOneField` opcional hacia `Usuario`,
para permitir que un cliente mayorista inicie sesión y el sistema sepa qué
registro de `ClienteMayorista` le corresponde al consultar catálogo (RF-14)
o crear pedidos (RF-15). La lógica de login/portal se implementa en Fase 3.

## 4. Comandos de migración

```bash
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py test apps
```

## 5. Datos de desarrollo

`python manage.py seed_dev_data` crea (de forma idempotente y solo si
`DJANGO_DEBUG=True`): los 5 roles de negocio, un usuario `admin` de
desarrollo (contraseña tomada de `DJANGO_DEV_ADMIN_PASSWORD` o generada al
azar e impresa una sola vez en consola — nunca hardcodeada ni subida a
Git), y un proveedor + prenda + variantes de ejemplo para verificar el
esquema desde el Admin.

## 6. Conexión a PostgreSQL

La configuración vive en `backend/config/settings/base.py` y se completa
con variables de entorno (`DATABASE_NAME/USER/PASSWORD/HOST/PORT` en
`.env`, ver `.env.example`). El contenedor `backend` aplica migraciones
automáticamente al arrancar (`docker/backend/entrypoint.sh`).

## 7. Pendiente para fases futuras (fuera de alcance de la Fase 2)

- Servicios que calculan `valor_cif`, `Costeo.costo_total` y `Tributo.monto`,
  y que mantienen sincronizado `VarianteProducto.stock_disponible` a partir
  de `MovimientoInventario`.
- Validación de cantidad mínima por modelo al crear un `PedidoMayorista`.
- Registro automático en `Bitacora` (señales/middleware).
- Autenticación, permisos por rol y endpoints REST (Fase 3+).
