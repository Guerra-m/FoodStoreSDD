## Why

El sistema necesita identificar quién opera en cada endpoint para aplicar reglas de negocio, proteger rutas administrativas y asociar pedidos a clientes. Sin autenticación ni roles, cualquier usuario puede acceder a cualquier recurso — inviable para un e-commerce real.

## What Changes

- Registro de nuevos usuarios con hash de contraseña (bcrypt)
- Login con generación de JWT (access token + refresh token)
- Refresh token con rotación en base de datos (invalida el token anterior)
- Logout que invalida el refresh token activo
- Sistema de roles (Cliente, Admin, Delivery) con seed data
- Middleware de autorización por roles para proteger rutas
- Ampliación del modelo `Usuario` existente con relación a roles
- Implementación del módulo `usuarios` completo: router → service → repository

## Capabilities

### New Capabilities
- `user-auth`: Gestión de autenticación — registro, login, JWT access/refresh tokens con rotación, logout.
- `authorization`: Sistema de roles y permisos — middleware de autorización por roles, seed de roles base (Cliente, Admin, Delivery).

### Modified Capabilities
- *(none — infra-core no cambia sus requisitos, solo se completa el seed)*

## Impact

- **Backend**: Nuevo módulo `usuarios` completo (router, service, repository, schemas). Modelo `Usuario` modificado con relación a `Role`. Archivo `security.py` implementado con JWT utils. Nuevo modelo `RefreshToken` para rotación. Nuevo modelo `Role` + tabla asociativa `usuarios_roles`. Seed actualizado con roles iniciales.
- **Frontend**: Futuras pantallas de login/registro (próximo change o parte de UI).
- **Dependencias**: `python-jose` para JWT, `bcrypt` o `passlib[bcrypt]` para password hashing. Ya existen en `config.py` las variables `SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS`.
