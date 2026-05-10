## ADDED Requirements

### Requirement: Crear dirección de entrega
El sistema SHALL permitir al cliente autenticado registrar una nueva dirección de entrega con los campos: calle, número, ciudad, provincia, código postal, y opcionalmente latitud y longitud.

#### Scenario: Crear dirección exitosamente
- **WHEN** un cliente envía datos válidos de dirección a `POST /api/v1/clientes/direcciones`
- **THEN** el sistema SHALL crear la dirección asociada al cliente y devolverla con código 201

#### Scenario: Crear primera dirección como principal
- **WHEN** un cliente sin direcciones previas crea su primera dirección
- **THEN** el sistema SHALL marcarla automáticamente como dirección principal

### Requirement: Listar direcciones del cliente
El sistema SHALL devolver todas las direcciones del cliente autenticado, indicando cuál es la principal.

#### Scenario: Listar direcciones
- **WHEN** un cliente solicita `GET /api/v1/clientes/direcciones`
- **THEN** el sistema SHALL devolver la lista de sus direcciones, cada una con un campo `es_principal`

### Requirement: Actualizar dirección
El sistema SHALL permitir al cliente modificar cualquier campo de una de sus direcciones existentes.

#### Scenario: Actualizar dirección exitosamente
- **WHEN** un cliente envía datos actualizados a `PUT /api/v1/clientes/direcciones/{id}`
- **THEN** el sistema SHALL actualizar la dirección y devolverla con código 200

#### Scenario: Actualizar dirección de otro cliente
- **WHEN** un cliente intenta actualizar una dirección que no le pertenece
- **THEN** el sistema SHALL devolver error 404 (Not Found)

### Requirement: Eliminar dirección
El sistema SHALL permitir al cliente eliminar una de sus direcciones.

#### Scenario: Eliminar dirección exitosamente
- **WHEN** un cliente elimina una dirección secundaria vía `DELETE /api/v1/clientes/direcciones/{id}`
- **THEN** el sistema SHALL eliminar la dirección y devolver código 204

#### Scenario: Eliminar dirección principal
- **WHEN** un cliente intenta eliminar su única dirección o su dirección principal
- **THEN** el sistema SHALL devolver error 400 indicando que debe establecer otra dirección como principal antes de eliminar

### Requirement: Marcar dirección como principal
El sistema SHALL permitir al cliente establecer cuál de sus direcciones es la principal.

#### Scenario: Cambiar dirección principal
- **WHEN** un cliente envía `PATCH /api/v1/clientes/direcciones/{id}/principal`
- **THEN** el sistema SHALL desmarcar la dirección principal anterior y marcar la nueva como principal

#### Scenario: Dirección principal única
- **WHEN** un cliente consulta sus direcciones
- **THEN** exactamente una dirección SHALL tener `es_principal = true`
