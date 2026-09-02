### 📘 CONTEXTO MAESTRO — TRENDY IMPORT SRL
| Campo | Valor |
| ------ | ------ |
| **Proyecto** | **Sistema Web de Importación Mayorista de Ropa Juvenil Femenina** [63] |
| **Cliente** | Trendy Import SRL [63] |
| **Materia / Docente** | Ingeniería de Software I · Docente: Sixto Fuentes Medrano [63] |
| **Integrantes** | Shirley Yessica Escobar Gutierrez · Oscar Alejandro Segovia Villarreal [63] |
| **Versión Actual** | **v1.4.0 — Fase 4: API REST de Negocio (Estable)** [95, 102] |
| **Enfoque** | Integración del flujo de importación, aduana, costeo, inventario, catálogo y pedidos B2B con variantes y reglas comerciales [95]. |

---

### 📊 1. ESTADO ACTUAL DEL PROYECTO
El proyecto ha completado la **Fase 5 - Frontend de Negocio y Pruebas E2E** [95]: los cuatro sprints académicos están cerrados, con el backend de la Fase 4, la base de datos con todo el modelo relacional de la Fase 2 [102, 123], y la autenticación por sesión segura de la Fase 3 [112] totalmente consumidos desde la interfaz React.

#### A. Estado por Fase de Desarrollo
*   **Fase 1 (Arquitectura Base):**  ✅ **Completo**. Estructura modular, Docker Compose funcional con servicios independientes para PostgreSQL, Django (backend), React (frontend) y Nginx como proxy reverso [96, 100].
*   **Fase 2 (Modelado e Integridad de BD):** ✅ **Completo**. Estructura relacional e inalterable en base a clases abstractas y relaciones protegidas (`on_delete=models.PROTECT`) [123, 124, 129]. Migraciones aplicadas en PostgreSQL, semilla de datos de desarrollo (`seed_dev_data`) con credenciales dinámicas en consola y registros de ejemplo [131, 132].
*   **Fase 3 (Autenticación y Seguridad):** ✅ **Completo**. Autenticación por sesión segura basada en cookies (`sessionid` y `csrftoken` HttpOnly) para blindaje contra vulnerabilidades XSS [102, 112]. Matriz de roles y permisos modular de cinco perfiles: *Administrador, Operador de Comercio Exterior, Agente Aduanal, Contabilidad y Cliente Mayorista* [114].
*   **Fase 4 (API REST de Negocio):** ✅ **Completo**. Endpoints bajo `/api/v1/` para todas las entidades críticas, cálculo automático en backend de CIF, tributos y costeos [95, 104, 106]. Lógica transaccional de pedidos B2B con validación en base de datos de cantidades mínimas por modelo por cliente, reserva inmediata de inventario con selectores transaccionales atómicos (`select_for_update`) y registros de auditoría explícita en bitácora [106, 108]. OpenAPI 3 y Swagger integrados [95, 103].
*   **Fase 5 (Frontend de Negocio & Pruebas E2E):** ✅ **Completo — los 4 sprints cerrados.** Sprint 1 (Autenticación, Layout Shell, CRUDs Maestros), Sprint 2 (Importaciones, Documentos y Costeo), Sprint 3 (Catálogo Mayorista y Pedidos B2B) y Sprint 4 (Reportes con gráficos + CSV, Bitácora de auditoría paginada, suite E2E completa). Consumo de la API REST desde la interfaz React por parte de todos los componentes de negocio (catálogo interactivo, creación de pedidos, gestor de importaciones, reportes agregados) y automatización de pruebas de extremo a extremo (E2E) con Playwright [100, 101] — suite real y ejecutable desde `package.json` en la raíz (`npx playwright test`, 12/12 PASSED). Backend con 85 tests (`python manage.py test apps`) y 94% de cobertura (`coverage report`). Ver [`docs/04-SPRINTS.md`](04-SPRINTS.md) para la planificación detallada.

---

### 🏗️ 2. ARQUITECTURA Y STACK TECNOLÓGICO
El sistema utiliza una arquitectura desacoplada donde el frontend y el backend actúan de forma autónoma, comunicándose mediante peticiones HTTP/REST mediadas por un proxy inverso único [96].

#### A. Stack de Producción
| Capa | Tecnología | Versión / Detalle |
| ------ | ------ | ------ |
| **Backend framework** | Django + Django REST Framework | Python 3.12, Django 5.2 LTS, DRF [96] |
| **Base de datos** | PostgreSQL 16 | Relacional, robusta, aislada en red Docker [96] |
| **Autenticación** | Django Session & CSRF Cookies | `SessionAuthentication` segura con cookies HttpOnly (`sessionid`) y protección CSRF (`X-CSRFToken`) [102, 112, 113] |
| **Servidor / Proxy** | Nginx | Punto único de entrada (Puerto 80). Enruta `/` a frontend, `/api/` y `/admin/` a backend [96, 98] |
| **Frontend Runtime** | React 19 + TypeScript + Vite | Desarrollo moderno y tipado fuerte para evitar errores en cliente [96] |
| **Diseño / Estilos** | Tailwind CSS v4 + shadcn/ui | Estilos rápidos, utilitarios y componentes UI consistentes [96] |
| **Documentación** | drf-spectacular + Swagger UI | `/api/docs/` interactivo y `/api/schema/` autogenerado [103] |
| **Pruebas de Negocio** | Pytest / Django Test + Playwright | Cobertura integral desde lógica de base de datos hasta navegador [96] |

#### B. Directiva Crítica de Seguridad: Same-Origin Session Auth
Para simplificar la arquitectura y maximizar la seguridad, el sistema prescinde de tokens stateless (como JWT) en favor de cookies HttpOnly nativas [112]. Al operar bajo el mismo origen gracias al mapeo de Nginx [112]:
1. El frontend **nunca** almacena credenciales ni tokens en `localStorage` o `sessionStorage`, impidiendo el robo de sesión por inyección XSS [112].
2. El cliente HTTP de React debe incluir `credentials: "include"` de forma obligatoria en cada petición [113].
3. Toda petición mutante (POST, PUT, PATCH, DELETE) debe adjuntar el encabezado `X-CSRFToken` recuperado de la cookie no-HttpOnly `csrftoken` [113].

---

### ⚙️ 3. CONVENCIONES DE CÓDIGO
Estandarización mandatoria para asegurar la consistencia del desarrollo colaborativo.

#### A. Python / Django (PEP 8 Estricto)
*   **Lógica de Negocio Aislada:** La lógica de cálculo, transiciones y validación pesada se encapsula en servicios de dominio (ej. `apps/importaciones/services.py`, `apps/pedidos/services.py`) [106]. Las vistas solo actúan como controladores de transporte de datos [12].
*   **Serializers DRF:** Responsables exclusivos de transformar formatos y realizar validaciones matemáticas básicas [12]. Los datos calculados en backend (como `valor_cif` o `stock_disponible`) deben declararse como `read_only=True` [106].
*   **Nomenclatura:** Archivos en `snake_case`. Clases en `PascalCase`. Métodos privados con prefijo `_` [12].

#### B. React / Frontend
*   **Componentes Funcionales:** Uso de Hooks estándar y customizados, libre de componentes de clase [13].
*   **Estilos Limpios:** Uso exclusivo de clases utilitarias de Tailwind CSS v4 [13]. Queda prohibido el uso de estilos CSS inline o selectores arbitrarios [13].
*   **Servicios API centralizados:** Las llamadas HTTP se agrupan en `frontend/src/services/api.ts` y derivados [13, 101, 102]. No se permite el uso directo de `fetch` o `axios` aislados dentro de componentes [13].

##### 🎨 Ley de Consistencia Visual y Reutilización UI/UX (Obligatoria en todos los módulos)

Esta ley tiene carácter de mandato técnico de repositorio. Toda pantalla nueva —Catálogo, Importaciones, Pedidos, Costeos— debe cumplirla sin excepción.

*   **Centralización Temática:** El diseño estético de Trendy Import SRL se rige estrictamente por la paleta HSL definida en `frontend/src/index.css`. Está rotundamente prohibido usar estilos inline, colores hexadecimales directos (`#RGB`) o clases de color absoluto de Tailwind (`bg-pink-600`, `text-gray-900`) en componentes de negocio. Se deben utilizar exclusivamente los tokens de diseño de marca: `bg-primary`, `bg-secondary`, `bg-card`, `text-muted-foreground`, `text-primary-foreground`, `border`, `rounded-xl`, etc.

*   **Esqueleto Estándar de CRUDs:** Toda nueva pantalla de negocio hereda exactamente la misma estructura de tres bloques construida en el módulo de Usuarios:

    1.  **Tarjeta de Cabecera (Action Bar Card):** Buscador e inputs de control agrupados en una tarjeta con clases `bg-card border rounded-xl shadow-sm shadow-primary/5 p-6 mb-6`. El buscador y el botón de creación principal se distribuyen horizontalmente dentro de esta tarjeta.

    2.  **Grilla de Datos Premium (Interactive Table):** Las filas de la tabla deben incluir hover animado uniforme (`hover:bg-secondary/40 transition-colors duration-200`). Los encabezados deben usar `bg-muted/50 font-semibold`. Los badges de estado, rol o categoría deben utilizar colores pastel con bordes suaves, sin colores absolutos. Los controles de paginación deben consumir los query strings del backend.

    3.  **Formularios Modales Adaptativos (Dialog Shell):** Todo modal de formulario (`Dialog`) debe:
        *   Restringir su ancho mínimo a `sm:max-w-[600px]` (o superior para datos extensos) para evitar layouts asfixiados.
        *   Estructurarse internamente con rejilla responsiva de dos columnas: `grid grid-cols-1 sm:grid-cols-2 gap-4`.
        *   Marcar cada campo obligatorio con un asterisco de color de alerta (`text-destructive`).
        *   Incluir un spinner animado (`Loader2` de `lucide-react`) que bloquee el botón de submit durante peticiones activas para prevenir dobles envíos.

*   **Gestión Unificada de Errores y Notificaciones:** Todos los formularios de todos los módulos redirigen sus flujos de error a través de la función centralizada `extractErrorMessage` de `api.ts`. Las validaciones de campo devueltas por Django REST Framework se exponen uniformemente mediante Toasts enriquecidos de Sonner. Queda prohibido exponer mensajes de error crudos directamente en la UI.

---

### 🛡️ 4. REGLAS DE NEGOCIO E INTEGRIDAD DE DATOS
El backend es la única fuente de verdad y nunca delega el cumplimiento de las reglas fiscales y comerciales al frontend [106].

#### A. Flujo de Importación y Aduana
*   **Cálculo de CIF:** Automático e inmutable por backend. `valor_cif = valor_fob + valor_flete + valor_seguro` [75, 106].
*   **Cálculo de Tributo:** Basado en porcentaje simple: `monto = base_imponible * porcentaje / 100`. El agente o contador introduce de forma manual la base imponible del tributo [106, 110].
*   **Nacionalización y Costeo Total:** Suma acumulada de `valor_cif` más tributos calculados de la importación [106]. Se ejecuta a través de `POST /importaciones/{id}/calcular-costeo/` [104, 106].
*   **Estados de Despacho (Transiciones):** Las operaciones de importación transitan de forma estrictamente lineal: `REGISTRADA` ➔ `EN_TRANSITO` ➔ `EN_ADUANA` ➔ `LIBERADA` (con opción a `CANCELADA` antes de liberarse) [107]. La liberación de la aduana ejecuta un trigger automático en backend que genera las entradas correspondientes en el stock de inventario por cada variante registrada [107].

#### B. Flujo de Pedidos y Catálogo Mayorista
*   **Variantes de Prenda:** Cada modelo de `Prenda` se asocia a múltiples `VarianteProducto` definidas por la combinación única de Talla y Color [70, 84, 91].
*   **Cantidad Mínima por Modelo (B2B):** Durante la creación de pedidos, el backend agrupa las líneas de pedido (`DetallePedido`) por `Prenda` matriz y valida que la cantidad total seleccionada sea mayor o igual que el límite configurado en `ClienteMayorista.pedido_minimo_modelo` [106, 127]. Si un solo modelo incumple, se cancela la transacción completa devolviendo un error `409 Conflict` [106, 109].
*   **Reserva Atómica de Stock:** Registrar un pedido exitoso descuenta de inmediato la cantidad solicitada de `VarianteProducto.stock_disponible` [106]. La operación se ejecuta de forma aislada mediante `select_for_update` y bloques transaccionales atómicos para prevenir condiciones de carrera y sobreventa (stock negativo) [106]. Si no existe stock suficiente para el pedido completo, se rechaza la transacción con un error `409 Conflict` (sin reservas parciales) [106, 109].
*   **Precio Histórico:** El precio unitario de las líneas de pedido se congela con el valor vigente de la variante en el instante exacto de la confirmación (`DetallePedido.precio_unitario = VarianteProducto.precio_unitario`) [106, 130]. Los cambios posteriores en el catálogo no afectan los pedidos históricos [106, 130].
*   **Seguridad del Catálogo:** El rol `Cliente Mayorista` solo puede ver prendas marcadas como `activo=True` y variantes en estado `PUBLICADO` [108]. Se le niega completamente el acceso a información financiera, costeos, aduana o proveedores [83, 108].

#### C. Integridad Física de la Base de Datos
*   **on_delete=models.PROTECT:** Mandatorio en claves foráneas que vinculen catálogos maestros y datos transaccionales de negocio (ej. Proveedores, Clientes, Variantes, Roles) [129]. Ningún registro con historial operativo puede borrarse físicamente de la base de datos [129].
*   **Clases Abstractas:** El modelo base `Tercero` es una clase abstracta en Python (`abstract = True`) [124]. Genera tablas separadas e independientes en Postgres para `Proveedor`, `ClienteMayorista`, `AgenteAduanal` y `Transportista`, optimizando las consultas sin necesidad de recurrir a costosos JOINs de multi-tabla [124].

---

### 🧪 5. ESTRATEGIA DE QA Y TESTING (CALIDAD EN CADA TURN)
*   **Test-Driven Development (TDD):** Aplicado estrictamente a la lógica de negocio nuclear del backend (cálculos matemáticos, estado de transiciones, validación de stock y cierres atómicos) antes de proceder con el código de visualización.
*   **Pruebas Unitarias e Integradas:** Utilizar `django.test.TestCase` en backend para validar serializadores, endpoints y servicios de dominio con simulación de estados de error.
*   **Pruebas E2E (Playwright):** Enfocadas en validar flujos completos de usuario final en el navegador (ej. simular el flujo completo de Login ➔ Selección de prendas ➔ Validación de cantidad mínima ➔ Registro de pedido con reserva de stock exitosa en Postgres) [95, 122].

---

### 🗂️ 6. GOBERNANZA DE LA DOCUMENTACIÓN
La evolución del sistema se registra obligatoriamente en la carpeta `docs/` para evitar la pérdida de conocimiento técnico y organizativo:

| Archivo | Rol |
| ------ | ------ |
| `docs/00-CONTEXTO_PROYECTO.md` | **Fuente de Verdad.** Arquitectura, stack, estado por módulo y reglas críticas de negocio (este archivo). |
| `docs/01-BITACORA_DESARROLLO.md` | Bitácora de desarrollo. Registro cronológico de hitos, commits, cambios de esquema de base de datos y tareas resueltas. |
| `docs/02-SESSION_MEM.md` | Memoria de sesión activa para agentes de IA. Sprint actual, objetivos y notas de trabajo en curso. |
| `docs/03-REQUERIMIENTOS.md` | Definición detallada de casos de uso (CU-01 a CU-13), requerimientos funcionales (RF) y no funcionales (RNF) del sistema [71, 74, 77]. |
| `docs/04-SPRINTS.md` | Planificación, estimación y métricas de calidad (SP, cobertura) por Sprint académico. |
| `docs/05-FINDINGS_DEUDA.md` | Registro centralizado de deuda técnica detectada, fallos por corregir y bugs pendientes de resolución. |
| `docs/06-TASK_PLAN.md` | Planificador detallado de tareas divididas por módulo de desarrollo. |
| `docs/07-PROMPT_DESARROLLO.md` | Protocolo de arranque de sesión. Alineación inmediata de contexto para la IA de desarrollo. |
| `docs/08-CONTROL_SESION.md` | Protocolos de validación, compilación de tests de calidad y criterios de aceptación antes del cierre de sesión. |
| `docs/09-GUIA_PRUEBAS.md` | Especificaciones de comandos para testing backend y suites E2E en Playwright. |
| `docs/10-CASOS_PRUEBA_UAT.md` | Plan de pruebas con datos reales para validación del cliente/docente. |