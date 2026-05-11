# authorization Specification - Implementation Delta

## Purpose
Sistema de autorización basado en roles (RBAC) que amplía la autenticación JWT. Define cómo se validan roles en endpoints y cómo se incluyen en tokens.

## ADDED Requirements

### Requirement: Roles incluidos en JWT
El sistema SHALL incluir los roles del usuario como claim "roles" en el access token JWT.

#### Scenario: JWT contiene roles del usuario
- **WHEN** el sistema genera un access token JWT después de autenticación
- **THEN** el token SHALL contener un claim "roles" con la lista de nombres de roles del usuario
- **AND** si el usuario no tiene roles asignados, la lista será vacía []

#### Scenario: JWT signature protege claims de roles
- **WHEN** un cliente intenta modificar el claim "roles" en el JWT
- **THEN** la firma HMAC-SHA256 se invalida y el servidor rechaza el token con 401

### Requirement: Dependencia require_roles() para validación
El sistema SHALL proveer una dependencia FastAPI `require_roles(roles: List[str])` que valide que el usuario autenticado posea al menos uno de los roles requeridos.

#### Scenario: Acceso permitido a usuario con rol requerido
- **WHEN** un usuario autenticado con rol "Admin" intenta acceder a un endpoint que requiere `require_roles(["Admin"])`
- **THEN** el sistema SHALL permitir el acceso y ejecutar el handler del endpoint

#### Scenario: Acceso permitido a usuario con rol en lista
- **WHEN** un usuario con rol "Admin" accede a endpoint que permite `require_roles(["Admin", "Moderator"])`
- **THEN** el sistema SHALL permitir el acceso

#### Scenario: Acceso denegado a usuario sin rol requerido
- **WHEN** un usuario autenticado con rol "Cliente" intenta acceder a endpoint que requiere `require_roles(["Admin"])`
- **THEN** el sistema SHALL devolver error 403 (Forbidden) con mensaje "Insufficient permissions"

#### Scenario: Acceso denegado sin autenticación
- **WHEN** un usuario no autenticado intenta acceder a un endpoint con `require_roles()`
- **THEN** el sistema SHALL devolver error 401 (Unauthorized)

### Requirement: Seed de roles del sistema
El sistema SHALL crear los tres roles base ("Cliente", "Admin", "Delivery") de forma idempotente.

#### Scenario: Seed crea roles base en primera ejecución
- **WHEN** se ejecuta `python scripts/seed.py` por primera vez
- **THEN** el sistema SHALL crear tabla Role con entradas para "Cliente", "Admin" y "Delivery" si no existen

#### Scenario: Seed es idempotente
- **WHEN** se ejecuta `python scripts/seed.py` múltiples veces
- **THEN** el sistema SHALL no crear duplicados de roles existentes

#### Scenario: Roles base tienen descripción
- **WHEN** se crean los roles
- **THEN** cada rol SHALL tener nombre único y descripción clara de su propósito

### Requirement: Asignación automática de rol por defecto
El sistema SHALL asignar automáticamente el rol "Cliente" a usuarios nuevos durante el registro.

#### Scenario: Nuevo usuario recibe rol Cliente
- **WHEN** un usuario completa exitosamente el endpoint POST /auth/register
- **THEN** el sistema SHALL asignar automáticamente el rol "Cliente" al usuario (insertar en usuarios_roles)
- **AND** el LoginResponse incluirá "roles": ["Cliente"]

#### Scenario: Rol Cliente permite acceso a endpoints de usuario
- **WHEN** un usuario con rol "Cliente" accede a /auth/me
- **THEN** el endpoint SHALL permitir acceso (no es endpoint protegido)

### Requirement: Actualizar respuestas de autenticación con roles
El sistema SHALL incluir roles en respuestas de login, register y refresh.

#### Scenario: LoginResponse incluye roles del usuario
- **WHEN** usuario completa exitosamente login
- **THEN** respuesta JSON SHALL contener campo "user" con atributo "roles": ["Cliente"] o similar

#### Scenario: RegisterResponse incluye rol asignado
- **WHEN** usuario completa exitosamente registro
- **THEN** respuesta SHALL contener "roles": ["Cliente"]

#### Scenario: Refresh actualiza roles en nuevo token
- **WHEN** usuario renueva token con POST /auth/refresh
- **THEN** nuevo access token SHALL contener versión actualizada de roles (en caso que hayan cambiado)

## MODIFIED Requirements

### Requirement: Autenticación (user-auth) - modificado
Se actualiza el flujo de autenticación para incluir roles:
- POST /auth/register → Asigna rol "Cliente" automáticamente
- POST /auth/login → Incluye "roles" en JWT y respuesta
- POST /auth/refresh → Incluye roles actualizados en nuevo JWT
- GET /auth/me → Puede incluir roles (opcional, están en JWT)
