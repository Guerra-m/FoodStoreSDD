## Why

El sistema de autenticación JWT (Change 7) está completo, pero los endpoints carecen de autorización granular. Actualmente cualquier usuario autenticado puede acceder a cualquier endpoint. Necesitamos un sistema de autorización basado en roles (RBAC) para proteger endpoints administrativos y delimitar acceso según el rol del usuario. Esto es crítico antes de implementar funcionalidades de admin dashboard, reportes y gestión de pedidos.

## What Changes

- **Agregamos roles como claims en JWT**: El access token incluirá la lista de roles del usuario
- **Creamos dependencia `require_roles()`**: Middleware para proteger endpoints según roles requeridos
- **Implementamos seed de roles**: Script que crea "Cliente", "Admin", "Delivery" de forma idempotente
- **Asignamos rol por defecto**: Nuevos usuarios reciben rol "Cliente" automáticamente al registrar
- **Actualizamos respuestas de autenticación**: Login y GET /auth/me incluyen roles del usuario
- **Agregamos tests de RBAC**: Tests para acceso permitido/denegado por rol
- **Documentamos permisos**: Guía clara de qué roles acceden a qué endpoints

## Capabilities

### New Capabilities
- `authorization`: Sistema de autorización por roles (RBAC) con middleware, JWT claims, seed de roles y control de acceso granular

### Modified Capabilities
- `user-auth`: Actualizamos schemas y servicios para incluir roles en JWT y respuestas de autenticación

## Impact

- **Backend APIs**: 5 endpoints modificados (/auth/register, /auth/login, /auth/refresh, /auth/logout, /auth/me)
- **Modelos**: User model incluye relación con roles (ya existe en usuarios/model.py)
- **Seguridad**: Endpoints administrativos quedan protegidos por rol
- **Base de datos**: Usa tablas Role y usuarios_roles existentes (no breaking)
- **Frontend**: Necesitará actualizar para mostrar roles y proteger rutas admin (Change 9)
- **Dependencies**: Sin nuevas dependencias requeridas
