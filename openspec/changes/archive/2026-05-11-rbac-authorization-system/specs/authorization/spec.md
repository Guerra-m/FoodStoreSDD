# authorization Specification - Implementation Delta

## Purpose
Sistema de autorización basado en roles (RBAC) que amplía la autenticación JWT.

## ADDED

### Requirement: Roles incluidos en JWT
El sistema SHALL incluir los roles del usuario como claim "roles" en el access token JWT.

#### Scenario: JWT contiene roles del usuario
- **WHEN** el sistema genera un access token JWT después de autenticación
- **THEN** el token SHALL contener un claim "roles" con la lista de nombres de roles del usuario

#### Scenario: JWT signature protege claims de roles
- **WHEN** un cliente intenta modificar el claim "roles" en el JWT
- **THEN** la firma HMAC-SHA256 se invalida y el servidor rechaza el token con 401

### Requirement: Dependencia require_roles() para validación
El sistema SHALL proveer una dependencia FastAPI `require_roles(roles: List[str])` que valide roles.

#### Scenario: Acceso permitido a usuario con rol requerido
- **WHEN** un usuario autenticado con rol "Admin" intenta acceder a un endpoint que requiere `require_roles(["Admin"])`
- **THEN** el sistema SHALL permitir el acceso

#### Scenario: Acceso denegado a usuario sin rol requerido
- **WHEN** un usuario autenticado con rol "Cliente" intenta acceder a endpoint que requiere `require_roles(["Admin"])`
- **THEN** el sistema SHALL devolver error 403 (Forbidden)

#### Scenario: Acceso denegado sin autenticación
- **WHEN** un usuario no autenticado intenta acceder a un endpoint con `require_roles()`
- **THEN** el sistema SHALL devolver error 401 (Unauthorized)

### Requirement: Seed de roles del sistema
El sistema SHALL crear los tres roles base ("Cliente", "Admin", "Delivery") de forma idempotente.

#### Scenario: Seed crea roles base idempotentemente
- **WHEN** se ejecuta `python -m scripts.seed` múltiples veces
- **THEN** el sistema SHALL no crear duplicados de roles existentes

### Requirement: Asignación automática de rol por defecto
El sistema SHALL asignar automáticamente el rol "Cliente" a usuarios nuevos durante el registro.

#### Scenario: Nuevo usuario recibe rol Cliente
- **WHEN** un usuario completa exitosamente POST /auth/register
- **THEN** el sistema SHALL asignar automáticamente rol "Cliente" al usuario
- **AND** la respuesta SHALL incluir "roles": ["Cliente"]

## MODIFIED

### Requirement: Autenticación (user-auth)
El sistema SHALL modificar endpoints de autenticación para incluir roles en JWT claims y respuestas.

#### Scenario: LoginResponse incluye roles
- **WHEN** usuario completa exitosamente POST /auth/login
- **THEN** respuesta SHALL contener user.roles con lista de roles del usuario
- **AND** el access token SHALL incluir claim "roles"

#### Scenario: Refresh actualiza roles en nuevo token
- **WHEN** usuario renueva token con POST /auth/refresh
- **THEN** nuevo access token SHALL contener versión actualizada de roles de BD

#### Scenario: RegisterResponse incluye roles
- **WHEN** usuario completa exitosamente POST /auth/register
- **THEN** respuesta SHALL contener user.roles: ["Cliente"]
