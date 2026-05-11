## Why

Food Store necesita un sistema de autenticación robusto para permitir que nuevos usuarios se registren y accedan a la plataforma. Actualmente, la aplicación no tiene un mecanismo de registro/login implementado, lo que es crítico para habilitar las funcionalidades de compra y gestión de cuenta. Esto cubre las historias de usuario US-001 (Registro de usuarios) y US-002 (Login de usuarios).

## What Changes

- **Backend (FastAPI)**: Implementar endpoints de registro (`POST /auth/register`), login (`POST /auth/login`), refresh token (`POST /auth/refresh`), y logout (`POST /auth/logout`). El sistema usará JWT para access tokens y refresh tokens opacos con rotación.
- **Frontend (React)**: Crear formularios de registro e inicio de sesión, integrar con endpoints de autenticación, guardar tokens en estado global (context/store), e implementar redirección automática a login cuando sea necesario.
- **Seguridad**: Implementar hash de contraseñas con bcrypt, validación de emails únicos, detección de robo de refresh tokens, y manejo seguro de tokens en el cliente.

## Capabilities

### New Capabilities

- `user-auth`: Sistema completo de autenticación con registro, login, refresh token con rotación, logout y obtención de perfil de usuario actual, usando JWT y bcrypt para seguridad.

### Modified Capabilities

<!-- Existing capabilities whose REQUIREMENTS are changing (not just implementation).
     Only list here if spec-level behavior changes. Each needs a delta spec file.
     Use existing spec names from openspec/specs/. Leave empty if no requirement changes. -->

(None - user-auth is a new capability being introduced)

## Impact

- **Backend**: Nueva carpeta `backend/app/auth/` con modelos, servicios y rutas de autenticación. Dependencias nuevas: `python-jose`, `bcrypt`, `pydantic`.
- **Frontend**: Nueva carpeta `frontend/src/features/auth/` con componentes de login/registro, contexto de autenticación, y hooks para manejo de sesión.
- **Base de datos**: Nueva tabla `users` con campos de email, contraseña hasheada, rol, y timestamps. Nueva tabla `refresh_tokens` para almacenar tokens revocados.
- **APIs**: Cambios en headers de autenticación en todas las requests autenticadas (agregar `Authorization: Bearer <token>`).
