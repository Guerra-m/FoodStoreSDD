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