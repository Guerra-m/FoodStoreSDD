# authorization Specification

## Purpose
Sistema de autorización basado en roles (RBAC). Define los roles del sistema, la asignación a usuarios y el middleware para proteger rutas según el rol requerido.

## ADDED Requirements

### Requirement: Roles del sistema
El sistema SHALL definir roles en una tabla `Role` con los valores base: Cliente, Admin, Delivery y Cocinero.

#### Scenario: Seed de roles
- **WHEN** se ejecuta el script de seed
- **THEN** el sistema SHALL crear los roles "Cliente", "Admin", "Delivery" y "Cocinero" si no existen (idempotente)

#### Scenario: Usuario con múltiples roles
- **WHEN** un usuario es asignado a múltiples roles
- **THEN** el sistema SHALL permitir la relación many-to-many mediante una tabla asociativa `usuarios_roles`

### Requirement: Middleware de autorización por roles
El sistema SHALL proveer una dependencia `require_roles(roles: list[str])` que verifique que el usuario autenticado posea al menos uno de los roles requeridos.

#### Scenario: Acceso permitido por rol
- **WHEN** un usuario autenticado con rol "Admin" accede a un endpoint que requiere "Admin"
- **THEN** el sistema SHALL permitir el acceso y ejecutar el handler

#### Scenario: Acceso denegado por rol insuficiente
- **WHEN** un usuario autenticado con rol "Cliente" accede a un endpoint que requiere "Admin"
- **THEN** el sistema SHALL devolver un error 403 (Forbidden)

### Requirement: Roles en JWT
El sistema SHALL incluir los roles del usuario como claims en el access token JWT.

#### Scenario: Roles en token
- **WHEN** el sistema genera un access token JWT
- **THEN** el token SHALL contener un claim "roles" con la lista de nombres de roles del usuario

### Requirement: Frontend Route Protection
The system SHALL protect frontend routes, ensuring only authorized users can access specific pages.

#### Scenario: Unauthorized access redirection
- **WHEN** user tries to access a protected route without the required role (fetched from Zustand)
- **THEN** the system SHALL redirect the user to `/unauthorized` or `/login`

### Requirement: Global Error Handling
The system SHALL handle API errors globally via Axios interceptors.

#### Scenario: API Error Notification
- **WHEN** an API request fails with 401, 403, 422, or 500 status
- **THEN** the system SHALL display a toast notification to the user

#### Scenario: 401 Unauthorized redirect
- **WHEN** an API request fails with 401 status
- **THEN** the system SHALL trigger an automatic user logout
