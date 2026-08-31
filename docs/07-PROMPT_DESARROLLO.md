# Protocolo de Inicio de Sesión — Trendy Import SRL

**Uso obligatorio:** Al iniciar cualquier sesión de desarrollo con un asistente de IA, envía este mensaje para asegurar alineación contextual inmediata:

> *"Lee el archivo `docs/07-PROMPT_DESARROLLO.md` y prepárate para trabajar en la tarea indicada."*

---

## PASO 1 — Carga de Contexto (Orden Estricto)

Antes de proponer código o ejecutar cualquier tarea, leer estos archivos en orden:

1. **`docs/02-SESSION_MEM.md`** → Sprint activo, objetivos vigentes y deuda técnica abierta.
2. **`docs/00-CONTEXTO_PROYECTO.md`** → Fuente de Verdad del sistema: stack, fases, reglas de negocio.
3. **`docs/05-FINDINGS_DEUDA.md`** → Bugs y debilidades conocidas antes de tocar código.
4. **`docs/06-TASK_PLAN.md`** → Tareas del sprint actual con responsables y dependencias.

---

## PASO 2 — Rol y Equipo

**Equipo de desarrollo:**
- **Shirley Yessica Escobar Gutierrez** — desarrolladora full stack, énfasis en frontend y componentes UI.
- **Oscar Alejandro Segovia Villarreal** — desarrollador full stack, énfasis en backend y arquitectura.

**Rol del asistente de IA:** Desarrollador Senior Full Stack experto en Python 3.12, Django 5.2, DRF, React 19 y TypeScript. Trabaja en español. El objetivo no es solo lograr que la interfaz compile, sino asegurar que el sistema sea **auditable, consistente, correcto y cubierto por pruebas de calidad**.

---

## PASO 3 — Stack Verificado

| Capa | Tecnología |
|------|-----------|
| Backend | Python 3.12, Django 5.2 LTS, Django REST Framework 3.15+ |
| Base de datos | PostgreSQL 16 |
| Autenticación | Django Session + CSRF Cookies (HttpOnly `sessionid`) |
| Proxy | Nginx (puerto 80, único punto de entrada) |
| Frontend | React 19 + TypeScript + Vite |
| Estilos | Tailwind CSS v4 + shadcn/ui |
| Pruebas | Pytest / Django Test + Playwright |

---

## PASO 4 — Invariantes del Repositorio (No Negociables)

Las siguientes reglas nunca se deben violar. Si una tarea parece requerirlo, detener y consultar primero.

### 4.1 Backend

**PROHIBIDO:**
- `on_delete=models.CASCADE` en claves foráneas sobre entidades maestras de negocio (Proveedor, Cliente, Prenda, Variante, Rol). Solo se permite en relaciones de línea-detalle hijo que dependen existencialmente de su cabecera (ej. `DetallePedido → PedidoMayorista`).
- Calcular `valor_cif`, `costo_total` o `stock_disponible` en el cliente HTTP o en un serializer. Son responsabilidad exclusiva de los servicios de dominio del backend.
- Sustituir la autenticación por sesión con cookies por tokens JWT o cualquier otro mecanismo stateless.
- Escribir lógica de negocio (cálculos, transiciones de estado, validaciones de dominio) dentro de `views.py` o `serializers.py`. Siempre va en `services.py`.

**OBLIGATORIO:**
- `on_delete=models.PROTECT` en todas las relaciones maestras de negocio.
- `select_for_update()` dentro de `transaction.atomic()` en toda operación que modifique `stock_disponible`.
- Registrar en `Bitacora` (mediante `auditoria_services.registrar()`) toda operación crítica: crear importación, cambiar estado de aduana, crear pedido.
- Tests unitarios o integrados para toda lógica de negocio nueva antes del merge.

### 4.2 Frontend

**PROHIBIDO:**
- `window.alert()`, `window.confirm()`, `window.prompt()`. Usar Toasts (Sonner) y `AlertDialog` de shadcn/ui.
- Estilos CSS inline (`style={{ ... }}`). Solo clases utilitarias de Tailwind CSS v4.
- Valores de negocio codificados como constantes en el cliente (precios, stocks, catálogos, roles). Todo viene de `/api/v1/`.
- Llamadas directas a `fetch()` o `axios` dentro de componentes. Solo se usa `api.ts` centralizado.
- El uso de `as any` o `@ts-ignore` sin comentario justificativo.
- Utilizar componentes de formulario que no implementen la clase de foco unificado (`focus-visible:ring-primary focus-visible:border-primary`).
- Crear botones de submit en formularios que no incluyan un indicador visual de carga (`loading state` con spinner `Loader2`) al procesar peticiones HTTP.
- Hardcodear anchos de modales inferiores a `sm:max-w-[500px]` para el llenado de información comercial.
- Diseñar tablas de datos de negocio que no cuenten con fila de acciones con iconos normalizados de `lucide-react`.
- Hardcodear códigos hexadecimales (`#RGB`), colores absolutos de Tailwind (`bg-pink-600`, `text-gray-900`) o estilos inline en componentes de módulos de negocio. Solo tokens HSL de `index.css`.

**OBLIGATORIO:**
- `credentials: 'include'` en todas las peticiones HTTP.
- Header `X-CSRFToken` en todas las peticiones mutantes (POST, PATCH, PUT, DELETE).
- Componentes de notificación accesibles (Toast para éxito/error, `AlertDialog` para confirmaciones destructivas).
- Heredar y aplicar los estilos de badge con colores pastel configurados para cada rol, estado o categoría en el catálogo y los módulos de transacciones. No se admiten badges con colores absolutos.
- Mapear las validaciones de error detalladas devueltas por Django REST Framework a través de la función `extractErrorMessage` de `api.ts`, exponiéndolas mediante Toasts enriquecidos de Sonner. Nunca exponer mensajes de error crudos directamente en la UI.

---

## PASO 5 — Cierre de Sesión

Al completar una entrega de código, actualizar estos archivos antes de cerrar:

1. **`docs/00-CONTEXTO_PROYECTO.md`** — si cambió el estado de alguna fase o módulo.
2. **`docs/01-BITACORA_DESARROLLO.md`** — agregar fila con fecha, autor, componentes tocados, hito y pruebas ejecutadas.
3. **`docs/02-SESSION_MEM.md`** — actualizar tareas completadas, tareas en progreso y notas de la sesión.
4. **`docs/05-FINDINGS_DEUDA.md`** — cerrar gaps resueltos; registrar nueva deuda detectada.
5. **`docs/06-TASK_PLAN.md`** — mover tareas al estado correcto (En progreso / Completado).
