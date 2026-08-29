# Autenticación, roles y permisos (Fase 3)

Este documento describe la implementación de autenticación, usuarios, roles
y permisos sobre el esquema de datos definido en la Fase 2
([docs/database.md](database.md)).

## 1. Estrategia de autenticación: sesión de Django (no JWT)

Nginx expone React (`/`) y Django (`/api/`, `/admin/`) bajo el **mismo
origen** (`http://localhost/`). En esa topología, la autenticación por
**sesión** de Django (cookie `sessionid`, `HttpOnly`) es más simple y segura
que JWT:

- Reutiliza el manejo de sesiones y el hashing de contraseñas ya provistos
  por Django (nunca se implementó criptografía propia).
- El logout es inmediato (`request.session.flush()`), sin necesidad de una
  tabla de *blacklist* de tokens como exigiría JWT para revocar sesiones.
- La cookie de sesión es `HttpOnly`: JavaScript nunca puede leerla, lo que
  reduce el riesgo de robo de sesión por XSS (a diferencia de guardar un
  JWT en `localStorage`).
- Ya estaba parcialmente configurado desde la Fase 2
  (`REST_FRAMEWORK.DEFAULT_AUTHENTICATION_CLASSES`), evitando instalar
  `djangorestframework-simplejwt` sin necesidad real (no hay múltiples
  clientes/dominios que justifiquen tokens *stateless*).

**Consecuencia para el frontend:** no hay tokens que guardar en
`localStorage` ni `sessionStorage`. El navegador maneja las cookies de forma
transparente; el frontend solo necesita:

1. Enviar `credentials: "include"` en cada `fetch`.
2. Adjuntar el header `X-CSRFToken` (valor de la cookie `csrftoken`, no
   `HttpOnly`) en peticiones que cambian estado (`POST`/`PUT`/`PATCH`/`DELETE`).

### Nota técnica: `SessionAuthentication` y el código 401 vs 403

Por defecto, DRF **degrada** un `401 No autenticado` a `403` cuando ningún
autenticador expone un desafío `WWW-Authenticate` (que es el caso de
`SessionAuthentication` "pura"). Como el proyecto necesita distinguir 401 de
403 (una petición sin sesión vs. una petición autenticada sin permiso), se
agregó `apps/usuarios/authentication.py` con una subclase mínima que expone
`authenticate_header`, y se configuró como
`REST_FRAMEWORK.DEFAULT_AUTHENTICATION_CLASSES` en lugar de la clase de DRF.
No cambia el comportamiento de autenticación, solo corrige el código HTTP.

## 2. Roles: se reutiliza el modelo `Rol` de la Fase 2

La Fase 2 ya implementó `Rol` como tabla propia (no `Groups` ni
`TextChoices` en `Usuario`) y `Usuario.rol` como FK. Esta fase **no
modifica ese modelo** (evita reabrir una migración ya aplicada sin
necesidad): se reutiliza tal cual, y la autorización se resuelve leyendo
`request.user.rol.nombre`.

Los cinco roles de negocio, creados por `seed_dev_data`
(`apps/usuarios/management/commands/seed_dev_data.py`):

| Constante (código) | `Rol.nombre` exacto |
|---|---|
| `ADMINISTRADOR` | `Administrador` |
| `OPERADOR_COMERCIO_EXTERIOR` | `Operador de Comercio Exterior` |
| `AGENTE_ADUANAL` | `Agente Aduanal` |
| `CONTABILIDAD` | `Contabilidad` |
| `CLIENTE_MAYORISTA` | `Cliente Mayorista` |

Estas constantes están centralizadas en `apps/usuarios/permissions.py`
(clase `Roles`) para no repetir los literales en cada vista/permiso.

## 3. Permisos: `HasRole`, no cinco clases por rol

`apps/usuarios/permissions.py` define `HasRole(*roles)`, una **fábrica** de
permisos DRF (no cinco clases sueltas):

```python
permission_classes = [IsAuthenticated, HasRole(Roles.ADMINISTRADOR, Roles.CONTABILIDAD)]
```

La autorización real siempre se valida en Django; React solo oculta/redirige
por UX (`ProtectedRoute`), nunca es la fuente de seguridad.

Los endpoints de negocio (catálogo, importaciones, costeo, etc.) **no se
crean en esta fase** — corresponden a la Fase 4 — pero ya cuentan con el
mecanismo de permisos (`HasRole`) listo para usarse. La matriz de permisos
completa por módulo está en el encargo de la Fase 3; se valida en
`apps/usuarios/tests.py` (`HasRolePermissionTests`) contra vistas de prueba
que representan un módulo administrativo y uno financiero, mientras no
existan los endpoints reales.

## 4. Relación Usuario ↔ ClienteMayorista

`ClienteMayorista.usuario` (definido en la Fase 2, `apps/terceros/models.py`)
es un `OneToOneField` **opcional** (`null=True, blank=True`) hacia
`AUTH_USER_MODEL`. Un cliente mayorista es una entidad comercial que puede
o no tener una cuenta de acceso al portal; esta fase no modifica esa
relación.

## 5. Endpoints de autenticación

| Método | Ruta | Descripción | Permiso |
|---|---|---|---|
| `POST` | `/api/auth/login/` | Autentica y crea la sesión | `AllowAny` |
| `POST` | `/api/auth/logout/` | Cierra la sesión (requiere `X-CSRFToken`) | `IsAuthenticated` |
| `GET`  | `/api/auth/me/` | Usuario autenticado actual | `IsAuthenticated` |

**Login exitoso** (`200`):
```json
{"user": {"id": 1, "username": "admin", "email": "...", "first_name": "", "last_name": "", "role": "Administrador"}}
```

**Login fallido** (credenciales inválidas, usuario inexistente o inactivo — `400`):
```json
{"detail": "Credenciales inválidas."}
```
El mismo mensaje genérico se usa en los tres casos para no revelar si un
usuario existe o no.

**`/api/auth/me/`** (`200`, autenticado):
```json
{"id": 1, "username": "admin", "email": "...", "first_name": "", "last_name": "", "role": "Administrador"}
```

Ninguna respuesta incluye contraseña, hash ni tokens.

**Códigos de error:**
- `401` — no autenticado (sin sesión válida).
- `403` — autenticado pero sin permiso (`HasRole` rechaza) o CSRF faltante/inválido en una petición de escritura.
- `400` — credenciales inválidas o datos de entrada mal formados.

## 6. CSRF: cómo lo maneja el frontend

1. Al cargar la app, `AuthContext` llama a `GET /api/auth/me/`. Esta vista
   está decorada con `ensure_csrf_cookie` sobre `dispatch` (no sobre `get`),
   así la cookie `csrftoken` se fija **incluso si la respuesta es 401**
   (sin esto, `IsAuthenticated` corta la petición antes de llegar al método
   `get` y la cookie nunca se fijaría para un visitante anónimo).
2. El login (`POST`) no exige CSRF: sin sesión previa, `SessionAuthentication`
   no lo comprueba (ver `enforce_csrf` en DRF). Al loguearse, Django rota el
   token CSRF por seguridad (`rotate_token`) y el navegador recibe uno nuevo.
3. `logout` (`POST`) sí exige CSRF: el frontend lee la cookie `csrftoken` y
   la envía como header `X-CSRFToken` (`authService.ts`).

## 7. Usuarios inactivos

`is_active=False` impide el login (`django.contrib.auth.authenticate` ya lo
valida). Si un usuario **ya tenía una sesión activa** y se desactiva
después, la siguiente petición autenticada falla con `401`: Django
comprueba `is_active` en cada request al resolver el usuario de la sesión
(`ModelBackend.get_user` → `user_can_authenticate`). No fue necesario
código adicional para este caso — es el comportamiento estándar de Django.

## 8. Cambio/recuperación de contraseña: fuera de alcance de esta fase

No se implementa autoservicio de cambio ni recuperación de contraseña en la
Fase 3: no hay un endpoint pedido para eso en el encargo, y "recuperar
contraseña" requeriría infraestructura de correo que todavía no existe en
el proyecto. Un administrador puede resetear la contraseña de cualquier
usuario desde Django Admin mientras no exista esa funcionalidad.

## 9. Administrador inicial

No hay credenciales hardcodeadas en el código. Opciones (ya existentes
desde la Fase 2, sin cambios):

```bash
# Opción recomendada en desarrollo: crea los 5 roles + un admin de prueba
# (contraseña desde DJANGO_DEV_ADMIN_PASSWORD, o aleatoria impresa una vez)
docker compose exec backend python manage.py seed_dev_data

# Alternativa estándar de Django
docker compose exec backend python manage.py createsuperuser
```

## 10. Cómo probar

**Automatizado:**
```bash
docker compose exec backend python manage.py test apps.usuarios
```

**Manual (vía Nginx, `http://localhost/`):**
1. `GET /api/auth/me/` sin sesión → `401` (también fija la cookie `csrftoken`).
2. `POST /api/auth/login/` con credenciales inválidas → `400`.
3. `POST /api/auth/login/` con credenciales válidas → `200` + cookie `sessionid`.
4. `GET /api/auth/me/` con sesión → `200` con los datos del usuario y su rol.
5. `POST /api/auth/logout/` con `X-CSRFToken` → `204`; sin el header → `403`.
6. Desactivar un usuario (`is_active=False`) y repetir 2 → `400`.

**Frontend:** abrir `http://localhost/`, verificar la redirección a
`/login`, iniciar sesión, comprobar el rol mostrado en el dashboard, cerrar
sesión, e intentar navegar directo a una ruta restringida por rol (p. ej.
`/usuarios`) sin la sesión adecuada.

## 11. Playwright (Fase 9)

`tests/` queda reservado para la suite E2E de la Fase 9 (login, logout,
redirecciones, roles, permisos). No se implementa todavía; solo se preserva
la estructura de carpetas existente desde la Fase 1.
