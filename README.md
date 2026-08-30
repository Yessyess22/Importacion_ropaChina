# Trendy Import SRL

Sistema web de importación mayorista de ropa de tendencia juvenil femenina.
Integra el flujo de **importación → gestión aduanera → costeo → inventario →
catálogo mayorista → pedidos B2B**, gestionando variantes de producto por
talla y color, y la regla de cantidad mínima de compra por modelo.

> **Estado actual: Fase 4 — API REST del sistema.**
> Sobre la autenticación de la Fase 3 ([docs/authentication.md](docs/authentication.md))
> se implementó la API REST de negocio bajo `/api/v1/` (catálogo,
> proveedores/clientes, importaciones con cálculo de CIF en backend,
> documentos, costeo/tributos/tipo de cambio, inventario, pedidos con
> validación de cantidad mínima y reserva de stock, y reportes), con
> paginación, filtros, permisos por rol y documentación OpenAPI (ver
> [docs/api.md](docs/api.md)). El frontend de negocio (más allá del login)
> corresponde a fases futuras.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Python 3.12, Django 5.2 LTS, Django REST Framework |
| Base de datos | PostgreSQL 16 |
| Frontend | React 19, TypeScript, Vite |
| Estilos / UI | Tailwind CSS v4, shadcn/ui |
| Infraestructura | Docker, Docker Compose, Nginx |
| Testing (fases futuras) | Pytest / Django Test, Playwright |

## Arquitectura

```
Usuario → Nginx (:80) → React (Vite, /)      — interfaz de usuario
                       → Django API (/api/)   — lógica de negocio, REST
                                    ↓
                               PostgreSQL     — persistencia
```

Arquitectura desacoplada: React y Django son aplicaciones independientes que
se comunican vía HTTP/REST. Nginx es el único punto de entrada expuesto al
usuario. Los contenedores se comunican entre sí por nombre de servicio Docker
(`backend`, `frontend`, `postgres`), nunca por IP.

## Estructura de carpetas

```
trendy-import/
├── backend/            # Proyecto Django (API REST)
│   ├── config/         # settings, urls raíz + urls_v1.py, pagination.py, exceptions.py
│   └── apps/           # apps de dominio (ver docs/database.md y docs/api.md)
│       ├── usuarios/       # Usuario (AbstractUser), Rol, auth (login/logout/me), permisos por rol
│       ├── terceros/       # Proveedor, ClienteMayorista, AgenteAduanal, Transportista + API
│       ├── catalogo/       # Prenda, VarianteProducto + API (RF-01, RF-08, RF-14)
│       ├── importaciones/  # OperacionImportacion, DetalleImportacion + API + cálculo de CIF (RF-03/04)
│       ├── documentos/     # Documento + API (RF-06)
│       ├── costeo/         # Costeo, Tributo, TipoCambio + API (RF-04/05/10)
│       ├── inventario/     # MovimientoInventario + servicio de stock atómico (RF-09)
│       ├── pedidos/        # PedidoMayorista, DetallePedido + API, mínimo por modelo y reserva de stock (RF-15/27)
│       ├── reportes/       # Endpoints de agregación de solo lectura (RF-11)
│       └── auditoria/      # Bitacora + servicio de registro (sección 39)
├── frontend/           # Proyecto React + TypeScript + Vite
│   └── src/
│       ├── context/        # AuthContext (usuario, rol, login, logout)
│       ├── hooks/           # useAuth
│       ├── services/        # authService (login/logout/me), api.ts (cliente HTTP /api/v1/)
│       ├── components/      # ProtectedRoute, ui/ (shadcn)
│       ├── pages/            # Login
│       ├── types/            # auth.ts, api.ts, catalogo.ts, terceros.ts, importaciones.ts, costeo.ts, pedidos.ts
│       └── layouts/ utils/ lib/
├── nginx/              # nginx.conf (reverse proxy)
├── docker/             # Dockerfiles de backend y frontend
├── docs/               # database.md, authentication.md, api.md, postman/
├── tests/              # Pruebas E2E (Playwright, fase futura)
├── docker-compose.yml
├── .env / .env.example
└── README.md
```

## Requisitos para ejecutar

- Docker y Docker Compose
- (Opcional para desarrollo fuera de Docker) Node.js 22 y Python 3.12

## Variables de entorno

Copiar `.env.example` a `.env` y completar los valores:

```bash
cp .env.example .env
```

| Variable | Descripción |
|---|---|
| `DJANGO_SECRET_KEY` | Clave secreta de Django (generar una propia, no reutilizar la de ejemplo) |
| `DJANGO_DEBUG` | `True` en desarrollo, `False` en producción |
| `DJANGO_ALLOWED_HOSTS` | Hosts permitidos, separados por coma |
| `DATABASE_NAME/USER/PASSWORD/HOST/PORT` | Conexión de Django a PostgreSQL |
| `POSTGRES_DB/USER/PASSWORD` | Inicialización del contenedor de PostgreSQL (deben coincidir con `DATABASE_*`) |
| `CORS_ALLOWED_ORIGINS` | Orígenes autorizados a consumir la API con credenciales (cookies) |
| `VITE_API_URL` | URL base que usará el frontend para llamar a la API |
| `DJANGO_DEV_ADMIN_PASSWORD` | (Opcional) contraseña fija para el usuario `admin` que crea `seed_dev_data`; si no se define, se genera una aleatoria |

Ver [docs/authentication.md](docs/authentication.md) para el detalle de autenticación, roles y permisos.

**Nunca** se suben credenciales reales a Git: `.env` está en `.gitignore`.

## Comandos principales

```bash
# Levantar todos los servicios (build + up)
docker compose up --build

# Levantar en segundo plano
docker compose up -d

# Ver logs de un servicio
docker compose logs -f backend

# Ejecutar comandos de Django dentro del contenedor
docker compose exec backend python manage.py <comando>

# Crear/aplicar migraciones (el entrypoint ya migra automáticamente al levantar)
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate

# Ejecutar la suite de pruebas de modelos
docker compose exec backend python manage.py test apps

# Cargar datos mínimos de desarrollo (roles, admin de prueba, ejemplo de catálogo)
# Solo funciona con DJANGO_DEBUG=True; nunca usar en producción.
docker compose exec backend python manage.py seed_dev_data

# Crear un superusuario manualmente
docker compose exec backend python manage.py createsuperuser

# Detener y eliminar contenedores
docker compose down
```

## Servicios Docker y puertos

| Servicio | Puerto host | Expuesto al host | Rol |
|---|---|---|---|
| `nginx` | 80 | Sí | Punto de entrada único |
| `frontend` | 5173 | Sí (conveniencia de desarrollo) | Vite dev server (HMR) |
| `backend` | 8000 | Sí (conveniencia de desarrollo, admin/DRF) | API Django |
| `postgres` | — | **No** | Base de datos (solo accesible dentro de la red Docker) |

En un entorno de producción futuro, únicamente el puerto 80/443 de Nginx
debería quedar expuesto.

## Flujo de arranque

1. Docker inicia `postgres` y espera a que su healthcheck (`pg_isready`) esté en verde.
2. `backend` espera a que `postgres` esté saludable, aplica migraciones automáticamente (`entrypoint.sh`) y levanta `runserver`.
3. `frontend` levanta el servidor de desarrollo de Vite.
4. `nginx` inicia y enruta `/` → `frontend`, `/api/` y `/admin/` → `backend`.
5. El sistema queda disponible en `http://localhost/`.

## Verificación rápida

- `http://localhost/` → interfaz de React; sin sesión redirige a `/login`.
- `http://localhost/api/health/` → `{"status": "ok", "service": "trendy-import-backend"}`.
- `http://localhost/api/v1/prendas/` → catálogo (requiere sesión iniciada).
- `http://localhost/api/docs/` → documentación interactiva (Swagger UI) de toda la API v1.
- `http://localhost/admin/` → panel de administración de Django (usuarios, roles, permisos).
- Autenticación: ver [docs/authentication.md](docs/authentication.md) para el flujo completo de login/logout/`/me` y cómo probarlo.
- API de negocio: ver [docs/api.md](docs/api.md) para endpoints, permisos por rol, filtros/paginación y las reglas de negocio que siempre valida el backend (CIF, tributos, cantidad mínima, reserva de stock).

## Estado actual del proyecto

- [x] Arquitectura y estructura de carpetas
- [x] Docker Compose con `postgres`, `backend`, `frontend`, `nginx`
- [x] Django + DRF conectado a PostgreSQL
- [x] React + TypeScript + Vite + Tailwind v4 + shadcn/ui
- [x] Nginx enrutando frontend y backend
- [x] Modelos de dominio, migraciones, Django Admin y pruebas básicas (Fase 2 — ver [docs/database.md](docs/database.md))
- [x] Autenticación por sesión, roles y permisos por rol en el backend, rutas protegidas en el frontend (Fase 3 — ver [docs/authentication.md](docs/authentication.md))
- [x] API REST `/api/v1/` para catálogo, terceros, importaciones (con CIF calculado en backend), documentos, costeo/tributos/tipo de cambio, inventario, pedidos (mínimo por modelo + reserva de stock) y reportes; paginación, filtros, permisos por rol y documentación OpenAPI (Fase 4 — ver [docs/api.md](docs/api.md))
- [ ] Frontend de negocio completo (más allá del login) y pruebas E2E con Playwright (fases futuras)

## Fases futuras

- **Fase 5+:** Frontend de negocio (catálogo, importaciones, pedidos, etc. consumiendo `frontend/src/services/api.ts`), pruebas E2E (Playwright), throttling/rate limiting para producción, notificaciones reales de estado de pedido.

---

## Flujo de Trabajo y Colaboración en Git

Para asegurar la consistencia y evitar colisiones de código entre **Shirley** y **Oscar** durante el desarrollo de la Fase 5, implementamos un esquema de Git Flow simplificado:

1. **Rama `main` (Producción Estable):**
   - Es sagrada. Solo contiene código completamente probado, libre de bugs y listo para ser evaluado por el docente.
   - Nadie realiza commits directos en `main`.

2. **Rama `dev` (Integración de Desarrollo):**
   - Es la base de integración de tareas diarias. De aquí parten las nuevas funcionalidades y aquí se fusionan.

3. **Ramas `feature/` (Funcionalidades de Sprint):**
   - Cada tarea individual se desarrolla en su propia rama que nace de `dev`.
   - Nomenclatura: `feature/s1-auth-context`, `feature/s2-calculo-cif`, `feature/s3-catalogo-grilla`.

4. **Protocolo de Integración y Revisión de Código (Peer Review):**
   - Al terminar una tarea, el desarrollador sube su rama al servidor remoto y abre un **Pull Request (PR)** apuntando a `dev`.
   - **Es obligatorio que el otro compañero revise visual y técnicamente el código** antes de aprobar el merge (comprobando que corran las migraciones, que no haya estilos inline y que los tests pasen en local).
   - Una vez aprobado el merge en `dev`, ambos actualizan sus ramas locales mediante `git pull origin dev` para trabajar sobre la última versión unificada.

---

## Guía de Arranque Rápido para Shirley y Oscar

Sigue estos pasos para sincronizar tu entorno local e iniciar el desarrollo:

**1. Clona el repositorio y muévete a la rama de desarrollo:**

```bash
git clone <URL-REPOSITORIO>
cd trendy-import
git checkout -b dev origin/dev
```

**2. Inicializa las variables de entorno:**

```bash
cp .env.example .env
# Abre .env y edita los valores si es necesario
```

**3. Levanta el entorno completo con Docker:**

```bash
docker compose up --build -d
```

**4. Aplica las migraciones y carga los datos maestros de prueba:**

```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed_dev_data
```

**5. Accede al sistema:**

| Servicio | URL |
|---------|-----|
| Plataforma Web (React) | http://localhost/ |
| Documentación interactiva de API (Swagger) | http://localhost/api/docs/ |
| Panel de Administración (Django Admin) | http://localhost/admin/ |
