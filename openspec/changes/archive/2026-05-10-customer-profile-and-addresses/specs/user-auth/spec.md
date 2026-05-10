## MODIFIED Requirements

### Requirement: Obtener usuario actual
El sistema SHALL permitir al usuario autenticado obtener su perfil, incluyendo sus direcciones de entrega si tiene rol Cliente.

#### Scenario: Perfil obtenido con direcciones
- **WHEN** un usuario autenticado con rol Cliente envía una request con su access token JWT al endpoint de perfil
- **THEN** el sistema SHALL devolver los datos del usuario junto con su lista de direcciones asociadas

#### Scenario: Perfil obtenido sin direcciones (roles no cliente)
- **WHEN** un usuario autenticado sin rol Cliente (Admin, Delivery) solicita su perfil
- **THEN** el sistema SHALL devolver los datos del usuario sin incluir direcciones
