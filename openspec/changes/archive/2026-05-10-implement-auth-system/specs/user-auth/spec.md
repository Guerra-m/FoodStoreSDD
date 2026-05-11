# user-auth Specification - Implementation Delta

## ADDED Requirements

### Requirement: Registro de usuarios
El sistema SHALL permitir el registro de nuevos usuarios con email único y contraseña hasheada mediante bcrypt.

#### Scenario: Registro exitoso
- **WHEN** un usuario envía nombre, email y contraseña válidos al endpoint POST /auth/register
- **THEN** el sistema SHALL crear el usuario con contraseña hasheada, asignarle rol "Cliente" por defecto y devolver los datos del usuario sin la contraseña

#### Scenario: Email duplicado
- **WHEN** un usuario intenta registrarse con un email ya existente
- **THEN** el sistema SHALL devolver un error 409 (Conflict) indicando que el email ya está registrado

#### Scenario: Validación de contraseña
- **WHEN** un usuario intenta registrarse con una contraseña menor a 8 caracteres
- **THEN** el sistema SHALL devolver un error 400 (Bad Request) indicando los requisitos de contraseña

#### Scenario: Validación de email
- **WHEN** un usuario intenta registrarse con un email inválido o vacío
- **THEN** el sistema SHALL devolver un error 400 (Bad Request) indicando formato de email requerido

### Requirement: Login con JWT
El sistema SHALL autenticar usuarios mediante email y contraseña, devolviendo un access token JWT (corta duración) y un refresh token opaco (larga duración).

#### Scenario: Login exitoso
- **WHEN** un usuario envía email y contraseña correctos al endpoint POST /auth/login
- **THEN** el sistema SHALL devolver un access token JWT (duración: 15 minutos) con sub (user_id), roles, exp y un refresh token aleatorio opaco

#### Scenario: Credenciales inválidas
- **WHEN** un usuario envía email o contraseña incorrectos
- **THEN** el sistema SHALL devolver un error 401 (Unauthorized) sin revelar si el email existe o la contraseña es incorrecta

#### Scenario: Usuario no encontrado
- **WHEN** un usuario intenta login con email que no existe en BD
- **THEN** el sistema SHALL devolver el mismo error 401 (Unauthorized) que credenciales inválidas, sin diferenciación

### Requirement: Refresh token con rotación
El sistema SHALL permitir renovar el access token mediante un refresh token, revocando el token anterior y emitiendo un nuevo par (rotación).

#### Scenario: Refresh exitoso
- **WHEN** un usuario envía un refresh token válido y no revocado al endpoint POST /auth/refresh
- **THEN** el sistema SHALL revocar el refresh token actual, emitir un nuevo access token (15 min) y un nuevo refresh token (7 días)

#### Scenario: Refresh token reutilizado (detección de robo)
- **WHEN** un refresh token ya revocado es enviado al endpoint de refresh
- **THEN** el sistema SHALL revocar TODOS los refresh tokens activos del usuario y devolver un error 401 (Unauthorized)

#### Scenario: Refresh token expirado
- **WHEN** un usuario intenta usar un refresh token cuya fecha de expiración ha pasado
- **THEN** el sistema SHALL devolver un error 401 (Unauthorized) y el usuario debe re-autenticarse

### Requirement: Logout
El sistema SHALL permitir cerrar sesión revocando el refresh token activo.

#### Scenario: Logout exitoso
- **WHEN** un usuario autenticado envía su refresh token al endpoint POST /auth/logout
- **THEN** el sistema SHALL revocar ese refresh token y devolver confirmación (200 OK)

#### Scenario: Logout sin refresh token
- **WHEN** un usuario intenta logout sin enviar un refresh token
- **THEN** el sistema SHALL devolver un error 400 (Bad Request) indicando que refresh token es requerido

### Requirement: Obtener usuario actual
El sistema SHALL permitir al usuario autenticado obtener su perfil actual usando su access token.

#### Scenario: Perfil obtenido exitosamente
- **WHEN** un usuario autenticado envía una request con su access token JWT válido al endpoint GET /auth/me
- **THEN** el sistema SHALL devolver los datos del usuario (id, email, nombre, rol, createdAt) sin la contraseña

#### Scenario: Token inválido o expirado
- **WHEN** un usuario envía un access token inválido, malformado o expirado
- **THEN** el sistema SHALL devolver un error 401 (Unauthorized) indicando token inválido

#### Scenario: Token no proporcionado
- **WHEN** un usuario intenta acceder a /auth/me sin enviar un access token
- **THEN** el sistema SHALL devolver un error 401 (Unauthorized) indicando que autorización es requerida

### Requirement: Validación de credenciales
El sistema SHALL validar todas las credenciales de forma segura sin revelar información que ayude a enumeración de usuarios.

#### Scenario: Respuesta genérica en login fallido
- **WHEN** se intenta login con cualquier combinación inválida (email no existe, email existe pero contraseña inválida)
- **THEN** el sistema SHALL responder con el mismo error 401 (Unauthorized) genérico

#### Scenario: Tiempo de respuesta consistente
- **WHEN** se compara el tiempo de respuesta entre login con email inexistente vs. contraseña inválida
- **THEN** ambos SHALL tomar aproximadamente el mismo tiempo para evitar timing attacks

## MODIFIED Requirements

(None - todas las requirements de user-auth se están implementando como parte de esta fase inicial)
