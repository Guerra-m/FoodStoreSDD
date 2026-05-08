## Context

El backend ya cuenta con el modelo `Usuario` (`app/modules/usuarios/model.py`) con campos básicos (nombre, email, password_hash) y los patrones core (`BaseRepository`, `UnitOfWork`, `global_exception_handler`). El archivo `security.py` está vacío. `config.py` ya define `SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES` (30) y `REFRESH_TOKEN_EXPIRE_DAYS` (7).

No existe aún autenticación, autorización ni sistema de roles. Cualquier request puede acceder a cualquier endpoint.

## Goals / Non-Goals

**Goals:**
- Registro de usuarios con email único y contraseña hasheada (bcrypt)
- Login que devuelve access token (JWT, corta duración) + refresh token (opaco, rotación en BD)
- Refresh token con rotación: cada uso emite un nuevo par e invalida el anterior
- Logout que revoca el refresh token activo
- Sistema de roles (Cliente, Admin, Delivery) con seed data
- Middleware de autorización por roles para proteger rutas (FastAPI Dependency)
- Arquitectura modular: router → service → repository (UoW)

**Non-Goals:**
- Pantallas de frontend (login/register UI) — se hará en change posterior
- Recuperación de contraseña (forgot/reset password)
- OAuth2 social (Google, GitHub, etc.)
- Permisos granulares (el sistema es por roles, no por permisos individuales)

## Decisions

### 1. JWT con refresh token opaco en BD (no JWT para refresh)
- **Decisión**: El access token es JWT con claims (sub, roles, exp). El refresh token es un string opaco aleatorio, almacenado como SHA256 hash en tabla `RefreshToken`.
- **Por qué**: Si un refresh token JWT es robado, no se puede revocar (a menos que tengamos blacklist). Un token opaco en BD permite revocación inmediata (logout, rotación). El costo de consultar BD en refresh es aceptable (operación poco frecuente).
- **Alternativa**: Refresh token JWT con blacklist en Redis. Descartado porque no tenemos Redis y agregaría otra dependencia.

### 2. bcrypt via passlib para password hashing
- **Decisión**: Usar `passlib[bcrypt]` en lugar de `bcrypt` directo o `hashlib`.
- **Por qué**: passlib abstrae el algoritmo, permite upgrade futuro y verifica automáticamente el esquema. bcrypt es el estándar actual para passwords.
- **Alternativa**: `hashlib.pbkdf2_hmac` — más control pero más código boilerplate.

### 3. Roles como tabla separada (no enum)
- **Decisión**: `Role` como tabla SQLModel con relación many-to-many a `Usuario` via `UsuarioRole`.
- **Por qué**: Un usuario puede tener múltiples roles (ej. Admin + Delivery). Si fuera enum, agregar un rol nuevo requeriría migración de esquema. Con tabla, es cuestión de insertar un row.
- **Alternativa**: Enum en columna `Usuario.rol` — más simple pero no escala a múltiples roles por usuario.

### 4. Middleware como FastAPI Dependency, no como middleware global
- **Decisión**: `require_roles()` como dependencia inyectable en cada router, no un middleware Starlette que intercepte todas las requests.
- **Por qué**: Las dependencies son explícitas en cada ruta, se pueden documentar automáticamente en OpenAPI, y permiten rutas públicas sin excluir del middleware.
- **Alternativa**: Middleware global con exclude_paths — más propenso a errores de configuración.

### 5. Rotación de refresh token (one-time use)
- **Decisión**: Cada vez que se usa un refresh token, se revoca y se emite uno nuevo. Si un token ya revocado se reenvía, se revocan TODOS los tokens del usuario (detección de robo).
- **Por qué**: Si un atacante roba un refresh token, solo puede usarlo una vez antes de que el usuario legítimo lo invalide. Si el atacante lo usa primero, el legítimo detecta el robo y pierde acceso (puede re-login).
- **Alternativa**: Refresh token reutilizable — más simple pero menos seguro.

## Riesgos / Trade-offs

| Riesgo | Mitigación |
|--------|------------|
| Un atacante roba un refresh token y lo usa primero | El usuario legítimo recibe un error 401 al refrescar → todos los tokens se revocan → el usuario debe re-login |
| SECRET_KEY débil → JWT forjado | Validar en CI que SECRET_KEY tenga mínimo 32 caracteres. En producción, usar variable de entorno |
| Token almacenado en localStorage (XSS) | El frontend deberá usar cookies httpOnly para refresh token (se documenta para el change de frontend) |
| Performance: consulta BD en cada request para verificar roles | Los roles viajan en el JWT (claim), no se consulta BD. Solo se consulta BD en refresh y logout |
