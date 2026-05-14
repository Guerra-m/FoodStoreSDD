# Delta for order-management

## MODIFIED Requirements

### Requirement: Transiciones de estado vía FSM

El sistema SHALL implementar una máquina de estados finitos (FSM) que controle las transiciones del `EstadoPedido`, garantizando que solo se permitan transiciones válidas y que cada transición quede registrada en el historial append-only.
(Previously: Solo admin autenticado podía transicionar pagar. Ahora también el rol Sistema vía webhook.)

#### Scenario: Transición válida desde pendiente a pagado

- **WHEN** un admin autenticado solicita transicionar un pedido en estado "pendiente" con acción "pagar", **O** el rol Sistema (vía webhook IPN validado por X-Signature) ejecuta la misma acción sobre un pedido en "pendiente"
- **THEN** el sistema SHALL cambiar el estado del pedido a "pagado" y registrar una entrada en el historial con el nuevo estado y descripción "Pago confirmado"

#### Scenario: Transición válida desde pendiente a cancelado

- **WHEN** el cliente propietario o un admin autenticado solicita transicionar un pedido en estado "pendiente" con acción "cancelar"
- **THEN** el sistema SHALL cambiar el estado del pedido a "cancelado", registrar el historial con descripción "Pedido cancelado", y restaurar el stock de todos los productos del pedido

#### Scenario: Transición válida desde pagado a preparando

- **WHEN** un admin autenticado solicita transicionar un pedido en estado "pagado" con acción "preparar"
- **THEN** el sistema SHALL cambiar el estado del pedido a "preparando" y registrar el historial con descripción "Preparación iniciada"

#### Scenario: Transición válida desde pagado a cancelado

- **WHEN** un admin autenticado solicita transicionar un pedido en estado "pagado" con acción "cancelar"
- **THEN** el sistema SHALL cambiar el estado del pedido a "cancelado", registrar el historial con descripción "Pedido cancelado (pagado)", y restaurar el stock de todos los productos del pedido

#### Scenario: Transición válida desde preparando a enviado

- **WHEN** un admin autenticado solicita transicionar un pedido en estado "preparando" con acción "enviar"
- **THEN** el sistema SHALL cambiar el estado del pedido a "enviado" y registrar el historial con descripción "Pedido enviado"

#### Scenario: Transición válida desde preparando a cancelado

- **WHEN** un admin autenticado solicita transicionar un pedido en estado "preparando" con acción "cancelar"
- **THEN** el sistema SHALL cambiar el estado del pedido a "cancelado", registrar el historial con descripción "Pedido cancelado (en preparación)", y restaurar el stock de todos los productos del pedido

#### Scenario: Transición válida desde enviado a entregado

- **WHEN** un admin autenticado solicita transicionar un pedido en estado "enviado" con acción "entregar"
- **THEN** el sistema SHALL cambiar el estado del pedido a "entregado" y registrar el historial con descripción "Pedido entregado"

#### Scenario: Transición inválida rechazada

- **WHEN** cualquier usuario solicita una transición no permitida desde el estado actual del pedido (ej. de "entregado" a "pagado", o de "cancelado" a "pendiente")
- **THEN** el sistema SHALL rechazar la operación con error 400 indicando que la transición no está permitida desde el estado actual

#### Scenario: Transición desde estado terminal rechazada

- **WHEN** cualquier usuario solicita cualquier transición sobre un pedido en estado "entregado" o "cancelado"
- **THEN** el sistema SHALL rechazar la operación con error 400 y mensaje "El pedido se encuentra en un estado terminal"

### Requirement: Autorización por rol en transiciones

El sistema SHALL validar que el usuario que solicita una transición tenga el rol adecuado según la acción.
(Previously: Solo cliente y admin. Ahora también rol Sistema puede ejecutar "pagar" sin JWT.)

#### Scenario: Cliente cancela su propio pedido en pendiente

- **WHEN** un cliente autenticado solicita cancelar un pedido propio en estado "pendiente"
- **THEN** el sistema SHALL permitir la operación

#### Scenario: Cliente no puede pagar un pedido

- **WHEN** un cliente autenticado solicita pagar un pedido propio
- **THEN** el sistema SHALL rechazar la operación con error 403 (la acción "pagar" requiere rol admin o sistema)

#### Scenario: Sistema ejecuta pagar sin JWT

- **WHEN** el rol Sistema (vía webhook IPN validado por X-Signature HMAC) solicita la acción "pagar" sobre un pedido en "pendiente"
- **THEN** el sistema SHALL permitir la operación sin requerir JWT ni autenticación de usuario
- **AND** SHALL validar la identidad del Sistema mediante la firma X-Signature del webhook

#### Scenario: Cliente no puede ver pedido ajeno

- **WHEN** un cliente autenticado intenta transicionar un pedido que no le pertenece
- **THEN** el sistema SHALL retornar 404 (no revelar existencia del pedido)

#### Scenario: Admin puede transicionar cualquier pedido

- **WHEN** un admin autenticado solicita cualquier transición válida sobre cualquier pedido
- **THEN** el sistema SHALL permitir la operación (sujeto a que la transición sea válida para el estado actual)

## ADDED Requirements

### Requirement: Transición FSM por webhook (Sistema in-process)

El webhook de MercadoPago SHALL invocar `transicionar_estado(accion="pagar")` con rol Sistema IN-PROCESS (llamando directamente al servicio, no vía HTTP), utilizando la FSM existente. El endpoint público `POST /api/v1/pedidos/{id}/transicion` SHALL permanecer como está (solo admin JWT) — no se expone el rol Sistema por HTTP.

#### Scenario: Webhook approved transiciona como Sistema

- **GIVEN** un webhook IPN válido con `status=approved`
- **WHEN** el sistema procesa el webhook y llama a `transicionar_estado(pedido_id, "pagar", None, "Sistema")`
- **THEN** la FSM SHALL validar la transición como si fuera el rol Sistema
- **AND** SHALL retornar el pedido con estado "pagado"

#### Scenario: Admin sigue usando endpoint HTTP estándar

- **WHEN** un admin autenticado envía `POST /api/v1/pedidos/{id}/transicion` con `{"accion": "pagar"}`
- **THEN** el sistema SHALL procesar la transición usando el mismo endpoint y FSM de siempre (sin cambios)
