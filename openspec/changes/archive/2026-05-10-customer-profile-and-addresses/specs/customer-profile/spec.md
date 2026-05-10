## ADDED Requirements

### Requirement: Visualización del perfil del cliente
El sistema SHALL permitir al usuario autenticado con rol Cliente ver su perfil completo, incluyendo nombre, email, teléfono, foto y fecha de nacimiento.

#### Scenario: Ver perfil propio
- **WHEN** un cliente autenticado solicita `GET /api/v1/clientes/perfil`
- **THEN** el sistema SHALL devolver nombre, email, teléfono, foto_url, fecha_nacimiento, fecha de creación y lista de direcciones asociadas

### Requirement: Edición del perfil del cliente
El sistema SHALL permitir al cliente autenticado actualizar su nombre, teléfono, foto_url y fecha_nacimiento. El email no es modificable.

#### Scenario: Actualizar perfil exitosamente
- **WHEN** un cliente envía datos válidos (nombre, teléfono, foto_url, fecha_nacimiento) a `PATCH /api/v1/clientes/perfil`
- **THEN** el sistema SHALL actualizar los campos y devolver el perfil completo actualizado

#### Scenario: Intento de cambiar email
- **WHEN** un cliente intenta cambiar su email a través del endpoint de perfil
- **THEN** el sistema SHALL ignorar el campo email o devolver un error 422 indicando que el email no es modificable
