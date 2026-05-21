## ADDED Requirements

### Requirement: Pago de pedido pendiente desde Mis Pedidos

El sistema SHALL permitir al cliente pagar un pedido en estado "pendiente" directamente desde la vista de detalle en la página Mis Pedidos.

#### Scenario: Botón "Pagar ahora" visible para pedidos pendientes
- **WHEN** un cliente visualiza el detalle de un pedido en Mis Pedidos
- **AND** el pedido está en estado "pendiente"
- **THEN** el sistema SHALL mostrar un botón "Pagar ahora" en el modal de detalle

#### Scenario: Botón "Pagar ahora" NO visible para pedidos pagados
- **WHEN** un cliente visualiza el detalle de un pedido en Mis Pedidos
- **AND** el pedido está en estado distinto a "pendiente" (ej: "pagado", "preparando", "entregado", "cancelado")
- **THEN** el sistema SHALL NO mostrar el botón "Pagar ahora"

#### Scenario: Pago exitoso desde Mis Pedidos
- **WHEN** el cliente hace clic en "Pagar ahora"
- **AND** completa el formulario de pago con MercadoPago CardPayment brick
- **AND** el pago es aprobado
- **THEN** el sistema SHALL mostrar una pantalla de "Pago aprobado"
- **AND** al cerrar el modal, la lista de pedidos SHALL reflejar el nuevo estado del pedido

#### Scenario: Pago rechazado desde Mis Pedidos
- **WHEN** el cliente intenta pagar desde Mis Pedidos
- **AND** el pago es rechazado
- **THEN** el sistema SHALL mostrar una pantalla de "Pago rechazado"
- **AND** SHALL ofrecer un botón "Reintentar" que permita al cliente intentar con otro medio de pago
