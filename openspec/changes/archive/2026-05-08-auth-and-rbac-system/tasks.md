## 1. Modelos y Dependencias

- [x] 1.1 Agregar dependencias `passlib[bcrypt]`, `python-jose[cryptography]` a `requirements.txt`
- [x] 1.2 Crear modelos `Role` y `UsuarioRole` (tabla asociativa) en `app/modules/usuarios/model.py`
- [x] 1.3 Crear modelo `RefreshToken` (id, token_hash, usuario_id FK, expires_at, revocado_en, creado_en) en `app/modules/usuarios/model.py`
- [x] 1.4 Agregar relación many-to-many `roles` al modelo `Usuario` existente

## 2. Seguridad y JWT

- [x] 2.1 Implementar `hash_password()` y `verify_password()` con passlib bcrypt en `app/core/security.py`
- [x] 2.2 Implementar `create_access_token()` (JWT con sub, roles, exp) en `app/core/security.py`
- [x] 2.3 Implementar `decode_access_token()` en `app/core/security.py`
- [x] 2.4 Implementar `generate_refresh_token()` (string aleatorio + SHA256 hash) en `app/core/security.py`
- [x] 2.5 Implementar dependencia `get_current_user()` que extrae usuario del JWT en `app/core/security.py`

## 3. Repositorios

- [x] 3.1 Crear `UsuarioRepository` con métodos: `get_by_email()`, `get_with_roles()` en `app/modules/usuarios/repository.py`
- [x] 3.2 Crear `RefreshTokenRepository` con métodos: `create()`, `find_by_hash()`, `revoke()`, `revoke_all_for_user()` en `app/modules/usuarios/repository.py`

## 4. Schemas

- [x] 4.1 Crear schemas Pydantic: `RegisterRequest`, `LoginRequest`, `TokenResponse`, `RefreshRequest`, `UserResponse` en `app/modules/usuarios/schema.py`

## 5. Servicio de Autenticación

- [x] 5.1 Implementar `AuthService.register()` — validar email único, hashear password, crear usuario con rol Cliente default
- [x] 5.2 Implementar `AuthService.login()` — verificar credenciales, generar access + refresh token, persistir refresh token
- [x] 5.3 Implementar `AuthService.refresh()` — validar refresh token, revocarlo, emitir nuevo par (rotación con detección de robo)
- [x] 5.4 Implementar `AuthService.logout()` — revocar refresh token

## 6. Router y Endpoints

- [x] 6.1 Crear `router.py` con endpoints: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`
- [x] 6.2 Registrar el router en `main.py`

## 7. Middleware de Autorización

- [x] 7.1 Implementar dependencia `require_roles(roles: list[str])` que verifica roles del JWT contra los requeridos y devuelve 403 si no coincide
- [x] 7.2 Agregar excepción HTTP `ForbiddenException` en `app/core/exceptions.py` (si no existe)

## 8. Seed Data

- [x] 8.1 Actualizar `scripts/seed.py` para crear roles base (Cliente, Admin, Delivery) de forma idempotente
- [x] 8.2 Agregar seed de un usuario Admin por defecto (solo en desarrollo)

## 9. Migración

- [x] 9.1 Crear migración manual de Alembic (`001_add_auth_and_rbac_models.py`) con tablas role, refresh_token, usuarios_roles
- [x] 9.2 Configurar PostgreSQL, ejecutar `alembic upgrade head` y `python -m scripts.seed`
