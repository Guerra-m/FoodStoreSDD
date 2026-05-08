# user-auth Specification

## Purpose
Sistema de autenticación basado en JWT con refresh token rotation. Gestiona registro, login, refresh y logout de usuarios.

## ADDED Requirements

### Requirement: Registro de usuarios
El sistema SHALL permitir el registro de nuevos usuarios con email único y contraseña hasheada mediante bcrypt.

#### Scenario: Registro exitoso
- **WHEN** un usuario envía nombre, email y contraseña válidos al endpoint de registro
- **THEN** el sistema SHALL crear el usuario con contraseña hasheada, asignarle rol "Cliente" por defecto y devolver los datos del usuario sin la contraseña

#### Scenario: Email duplicado
- **WHEN** un usuario intenta registrarse con un email ya existente
- **THEN** el sistema SHALL devolver un error 409 (Conflict) indicando que el email ya está registrado

### Requirement: Login con JWT
El sistema SHALL autenticar usuarios mediante email y contraseña, devolviendo un access token JWT (corta duración) y un refresh token opaco (larga duración).

#### Scenario: Login exitoso
- **WHEN** un usuario envía email y contraseña correctos
- **THEN** el sistema SHALL devolver un access token (JWT con sub, roles, exp) y un refresh token (string opaco aleatorio almacenado como SHA256 en BD)

#### Scenario: Credenciales inválidas
- **WHEN** un usuario envía email o contraseña incorrectos
- **THEN** el sistema SHALL devolver un error 401 (Unauthorized) sin revelar si el email existe o la contraseña es incorrecta

### Requirement: Refresh token con rotación
El sistema SHALL permitir renovar el access token mediante un refresh token, revocando el token anterior y emitiendo un nuevo par (rotación).

#### Scenario: Refresh exitoso
- **WHEN** un usuario envía un refresh token válido y no revocado
- **THEN** el sistema SHALL revocar el refresh token actual, emitir un nuevo access token y un nuevo refresh token

#### Scenario: Refresh token reutilizado (detección de robo)
- **WHEN** un refresh token ya revocado es enviado al endpoint de refresh
- **THEN** el sistema SHALL revocar TODOS los refresh tokens activos del usuario y devolver un error 401 (Unauthorized)

### Requirement: Logout
El sistema SHALL permitir cerrar sesión revocando el refresh token activo.

#### Scenario: Logout exitoso
- **WHEN** un usuario autenticado envía su refresh token al endpoint de logout
- **THEN** el sistema SHALL revocar ese refresh token y devolver confirmación

### Requirement: Obtener usuario actual
El sistema SHALL permitir al usuario autenticado obtener su perfil mediante el access token.

#### Scenario: Perfil obtenido
- **WHEN** un usuario autenticado envía una request con su access token JWT al endpoint de perfil
- **THEN** el sistema SHALL devolver los datos del usuario asociado al token
