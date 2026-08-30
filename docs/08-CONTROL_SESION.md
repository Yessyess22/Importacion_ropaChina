# Control de Calidad Pre-Sesión y Pre-PR — Trendy Import SRL

> Lista de verificación obligatoria antes de cerrar una sesión de desarrollo o abrir un Pull Request hacia `dev`. Todos los checks marcados con ✅ deben pasar. Un check en rojo bloquea el merge.

---

## 1. Verificación del Backend (Django / Python)

### 1.1 Formato y linting con Ruff

```bash
docker compose exec backend ruff check .
docker compose exec backend ruff format --check .
```

**Criterio de aceptación:** Cero errores reportados. Si hay advertencias de formato, ejecutar `ruff format .` antes del commit.

---

### 1.2 Suite de tests unitarios e integrados

```bash
docker compose exec backend python manage.py test apps --verbosity=2
```

**Criterio de aceptación:** Todos los tests en verde. Ningún test ignorado con `@skip` sin justificación documentada en el código.

**Cobertura mínima por sprint:**

| Sprint | Cobertura objetivo |
|--------|-------------------|
| Sprint 1 | ≥ 70% |
| Sprint 2 | ≥ 75% |
| Sprint 3 | ≥ 78% |
| Sprint 4 | ≥ 85% |

Para verificar la cobertura:

```bash
docker compose exec backend coverage run manage.py test apps
docker compose exec backend coverage report --fail-under=70
```

---

### 1.3 Verificación de migraciones pendientes

```bash
docker compose exec backend python manage.py migrate --check
```

**Criterio de aceptación:** Sin migraciones pendientes de aplicar. Si se modificó un modelo, ejecutar `makemigrations` y agregar el archivo al commit.

---

### 1.4 Verificación de integridad del proyecto Django

```bash
docker compose exec backend python manage.py check --deploy
```

**Criterio de aceptación:** Sin errores de sistema (`ERROR`). Los `WARNING` relacionados a configuración de producción (HTTPS, HSTS) son aceptables en entorno de desarrollo.

---

## 2. Verificación del Frontend (React / TypeScript)

### 2.1 Verificación de tipos TypeScript

```bash
cd frontend && npm run typecheck
# equivalente a: tsc --noEmit
```

**Criterio de aceptación:** Cero errores de tipos. No se acepta el uso de `@ts-ignore` o `as any` como solución rápida sin comentario justificativo.

---

### 2.2 Linting con ESLint

```bash
cd frontend && npm run lint
```

**Criterio de aceptación:** Cero errores de lint. Las advertencias (`warn`) deben revisarse; si son falsos positivos, documentar con `// eslint-disable-next-line <regla> -- razón`.

---

### 2.3 Verificación de invariantes del proyecto

Revisar manualmente o con `grep` que no se hayan introducido violaciones de las reglas del repositorio:

```bash
# Cero estilos inline en archivos TSX/JSX
grep -rn 'style={{' frontend/src/ --include="*.tsx" --include="*.jsx"

# Cero window.alert / confirm / prompt
grep -rn 'window\.alert\|window\.confirm\|window\.prompt' frontend/src/

# Cero fetch() directo fuera de services/
grep -rn '^\s*fetch(' frontend/src/ --include="*.ts" --include="*.tsx" \
  | grep -v 'frontend/src/services/'
```

**Criterio de aceptación:** Los tres comandos deben retornar sin coincidencias.

---

### 2.4 Build de producción sin errores

```bash
cd frontend && npm run build
```

**Criterio de aceptación:** Build exitoso sin errores. Las advertencias de tamaño de chunk son aceptables, pero deben revisarse si superan 500 kB.

---

## 3. Suite de Pruebas E2E (Playwright)

```bash
cd tests && npx playwright test
```

**Criterio de aceptación:** Todos los tests definidos para el sprint actual pasan en modo headless. Los tests de sprints futuros se pueden marcar con `.skip` temporalmente.

Para correr solo un archivo de pruebas:

```bash
npx playwright test e2e/auth.spec.ts
```

Para ver el reporte HTML de la última ejecución:

```bash
npx playwright show-report
```

---

## 4. Revisión de código por pares (Peer Review)

El revisor del PR verifica los siguientes puntos antes de aprobar el merge:

### Checklist del Revisor

**Backend:**
- [ ] No se introdujo `on_delete=models.CASCADE` en relaciones de entidades maestras de negocio.
- [ ] Los campos calculados por el backend (`valor_cif`, `stock_disponible`, `monto`) están declarados como `read_only=True` en los serializers.
- [ ] La lógica de negocio reside en `services.py`, no incrustada en `views.py` o `serializers.py`.
- [ ] Las operaciones de escritura sobre stock usan `select_for_update()` dentro de `transaction.atomic()`.
- [ ] Los nuevos endpoints tienen el decorador de permiso correspondiente (`IsAuthenticated`, `HasRole`).
- [ ] Las operaciones críticas registran en `Bitacora` mediante `auditoria_services.registrar()`.

**Frontend:**
- [ ] Los componentes obtienen datos exclusivamente a través de `api.ts` (no `fetch` directo).
- [ ] No hay valores de negocio (precios, stocks, catálogos) codificados como constantes en el cliente.
- [ ] Las notificaciones de éxito y error usan Toasts (Sonner), no `window.alert`.
- [ ] Las confirmaciones de acciones destructivas usan `AlertDialog` de shadcn/ui.
- [ ] Los formularios incluyen validación en el cliente que complementa (sin reemplazar) la del backend.
- [ ] Las rutas nuevas están registradas en `App.tsx` con el `ProtectedRoute` correcto y los roles permitidos.

---

## 5. Checklist Final antes del Merge

```
[ ] ruff check . → sin errores
[ ] npm run typecheck → sin errores
[ ] npm run lint → sin errores
[ ] python manage.py test apps → todos en verde
[ ] python manage.py migrate --check → sin migraciones pendientes
[ ] npx playwright test → todos los tests del sprint en verde
[ ] grep de invariantes (estilos inline, window.alert, fetch directo) → sin resultados
[ ] PR aprobado por el otro integrante del equipo
[ ] Rama actualizada con `git rebase origin/dev` antes del merge
[ ] docs/01-BITACORA_DESARROLLO.md actualizado con el hito del PR
[ ] docs/02-SESSION_MEM.md actualizado con el estado actual del sprint
```
