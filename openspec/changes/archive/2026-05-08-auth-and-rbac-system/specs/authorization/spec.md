# authorization Specification

## Purpose
Sistema de autorización basado en roles (RBAC). Define los roles del sistema, la asignación a usuarios y el middleware para proteger rutas según el rol requerido.

## ADDED Requirements

### Requirement: Roles del sistema
El sistema SHALL definir roles en una tabla `Role` con los valores base: Cliente, Admin y Delivery.

#### Scenario: Seed de roles
- **WHEN** se ejecuta el script de seed
- **THEN** el sistema SHALL crear los roles "Cliente", "Admin" y "Delivery" si no existen (idempotente)

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
