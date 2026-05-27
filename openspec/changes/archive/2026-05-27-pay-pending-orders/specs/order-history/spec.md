## ADDED Requirements

### Requirement: Pago de pedidos pendientes desde vista de detalle

El sistema SHALL permitir al cliente pagar un pedido pendiente desde el modal de detalle de "Mis Pedidos", sin necesidad de volver al carrito.

#### Scenario: Botón "Pagar ahora" visible para pedidos pendientes

- **WHEN** un cliente abre el detalle de un pedido con `estado === "pendiente"` y `payment_status !== "approved"`
- **THEN** el sistema SHALL mostrar un botón "Pagar ahora" con el total del pedido
- **AND** al hacer click, SHALL reemplazar la vista de detalle por el formulario de pago CardPayment Brick

#### Scenario: Pago exitoso desde Mis Pedidos

- **WHEN** el cliente completa el formulario de pago con una tarjeta válida
- **AND** el backend retorna éxito en `POST /pagos/crear`
- **THEN** el sistema SHALL activar polling a `GET /pagos/{pedido_id}` cada 5 segundos
- **AND** cuando `mp_status === "approved"`, SHALL mostrar pantalla de pago aprobado
- **AND** SHALL refrescar la lista de pedidos

#### Scenario: Pago rechazado desde Mis Pedidos

- **WHEN** el pago es rechazado (`mp_status === "rejected"`)
- **THEN** el sistema SHALL mostrar pantalla de error con botón "Reintentar"
- **AND** al clickear "Reintentar", SHALL reiniciar el formulario de pago

#### Scenario: Cierre del modal durante pago

- **WHEN** el usuario cierra el modal mientras hay un pago en estado `processing`
- **THEN** el sistema SHALL resetear el estado del paymentStore
- **AND** SHALL cerrar el modal sin afectar el pedido
