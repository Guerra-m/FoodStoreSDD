## ADDED Requirements

### Requirement: Historial de cambios de estado
El sistema SHALL mantener un registro inmutable de todos los cambios de estado de cada pedido.

#### Scenario: Primer estado registrado al crear pedido
- **WHEN** un pedido se crea exitosamente
- **THEN** el sistema SHALL registrar automáticamente el primer entry en el historial con estado_inicio="pendiente"

#### Scenario: Consultar historial de un pedido
- **WHEN** un administrador consulta GET /api/v1/pedidos/{id}/historial
- **THEN** el sistema SHALL retornar la lista completa de entradas del historial, ordenadas cronológicamente (más antiguo primero)

### Requirement: Información del historial
El sistema SHALL guardar para cada entrada del historial: estado, timestamp, usuario que realizó el cambio (si aplica), y descripción.

#### Scenario: Historial muestra transición automática
- **WHEN** un pedido cambia de estado de forma automática (ej: stock validado)
- **THEN** el sistema SHALL registrar: estado="pendiente", usuario=null (sistema), descripción="Pedido creado y validado"

#### Scenario: Historial muestra quién inició el cambio
- **WHEN** el cambio de estado es iniciado por el cliente (ej: pidió cancelación)
- **THEN** el sistema SHALL registrar el ID del cliente en el campo usuario

### Requirement: Auditoría de pedidos
El sistema SHALL permitir auditar el ciclo de vida completo de cada pedido.

#### Scenario: Trazabilidad completa del pedido
- **WHEN** un administrador necesita investigar un problema con un pedido
- **THEN** SHALL poder consultar: qué productos se compraron (snapshots), cuánto se pagó (precios snapshot), dónde se entregó (dirección snapshot), y todas las transiciones de estado con timestamps

#### Scenario: Pedido con transición de estados
- **WHEN** un pedido pasa por múltiples estados (pendiente → pagado → preparado → entregado)
- **THEN** el historial SHALL contener una entrada por cada transición con su timestamp correspondiente

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