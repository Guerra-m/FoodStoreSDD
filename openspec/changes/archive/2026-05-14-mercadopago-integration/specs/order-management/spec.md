## ADDED Requirements

### Requirement: Estado de pago en respuesta de pedido
El sistema SHALL incluir información del pago en las respuestas de los endpoints de pedido, mostrando el estado de pago actual y los datos relevantes de la transacción.

#### Scenario: Pedido pagado muestra datos de pago
- **WHEN** un cliente autorizado consulta GET /api/v1/pedidos/{id} de un pedido que fue pagado
- **THEN** el sistema SHALL incluir en la respuesta los campos: `estado_pago`, `metodo_pago`, y `preferencia_pago_url` si corresponde

#### Scenario: Pedido sin pagar muestra estado pendiente
- **WHEN** un cliente autorizado consulta GET /api/v1/pedidos/{id} de un pedido sin pago asociado
- **THEN** el sistema SHALL incluir `estado_pago: "pendiente"` o `"no_iniciado"`

### Requirement: Transición automática a pagado vía webhook
La FSM de pedidos SHALL permitir que el sistema (no un usuario humano) ejecute la transición a "pagado" cuando se recibe la confirmación de pago desde MercadoPago.

#### Scenario: Sistema transiciona pedido a pagado
- **WHEN** el webhook handler confirma un pago aprobado para un pedido en estado "pendiente"
- **THEN** el sistema SHALL ejecutar la transición FSM a "pagado" utilizando el servicio existente
- **AND** SHALL registrar en el historial: descripción "Pago confirmado vía MercadoPago"

#### Scenario: Webhook no puede transicionar pedido ya pagado
- **WHEN** se recibe un webhook de pago aprobado para un pedido que ya está en estado "pagado" o superior
- **THEN** el sistema SHALL ignorar la transición (la FSM la rechazará por estado inválido)
- **AND** SHALL registrar la transacción pero no modificar el pedido

## MODIFIED Requirements

### Requirement: Transiciones de estado vía FSM
El sistema SHALL implementar una máquina de estados finitos (FSM) que controle las transiciones del `EstadoPedido`, garantizando que solo se permitan transiciones válidas y que cada transición quede registrada en el historial append-only.

#### Scenario: Transición válida desde pendiente a pagado (original)
- **WHEN** un admin autenticado solicita transicionar un pedido en estado "pendiente" con acción "pagar"
- **THEN** el sistema SHALL cambiar el estado del pedido a "pagado" y registrar una entrada en el historial con el nuevo estado y descripción "Pago confirmado"

#### Scenario: Transición válida desde pendiente a pagado vía webhook (MODIFICADO)
- **WHEN** el sistema recibe una confirmación de pago vía webhook de MercadoPago para un pedido en estado "pendiente"
- **THEN** el sistema SHALL cambiar el estado del pedido a "pagado" y registrar una entrada en el historial con descripción "Pago confirmado vía MercadoPago"
- **AND** SHALL usar el mismo mecanismo de transición FSM, pero autenticado como "sistema" en lugar de un usuario específico

#### Scenario: Admin puede pagar manualmente (sin cambios)
- **WHEN** un admin autenticado solicita transicionar un pedido en estado "pendiente" con acción "pagar"
- **THEN** el sistema SHALL cambiar el estado del pedido a "pagado" y registrar una entrada en el historial con el nuevo estado y descripción "Pago confirmado"
