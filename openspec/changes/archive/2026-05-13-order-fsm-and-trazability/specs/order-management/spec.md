## ADDED Requirements

### Requirement: Transiciones de estado vía FSM
El sistema SHALL implementar una máquina de estados finitos (FSM) que controle las transiciones del `EstadoPedido`, garantizando que solo se permitan transiciones válidas y que cada transición quede registrada en el historial append-only.

#### Scenario: Transición válida desde pendiente a pagado
- **WHEN** un admin autenticado solicita transicionar un pedido en estado "pendiente" con acción "pagar"
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

#### Scenario: Cliente cancela su propio pedido en pendiente
- **WHEN** un cliente autenticado solicita cancelar un pedido propio en estado "pendiente"
- **THEN** el sistema SHALL permitir la operación

#### Scenario: Cliente no puede pagar un pedido
- **WHEN** un cliente autenticado solicita pagar un pedido propio
- **THEN** el sistema SHALL rechazar la operación con error 403 (la acción "pagar" requiere rol admin o sistema)

#### Scenario: Cliente no puede ver pedido ajeno
- **WHEN** un cliente autenticado intenta transicionar un pedido que no le pertenece
- **THEN** el sistema SHALL retornar 404 (no revelar existencia del pedido)

#### Scenario: Admin puede transicionar cualquier pedido
- **WHEN** un admin autenticado solicita cualquier transición válida sobre cualquier pedido
- **THEN** el sistema SHALL permitir la operación (sujeto a que la transición sea válida para el estado actual)

### Requirement: Restauración de stock al cancelar
El sistema SHALL restaurar el stock de todos los productos de un pedido cuando este se cancela desde los estados "pendiente", "pagado" o "preparando".

#### Scenario: Stock restaurado al cancelar pedido pendiente
- **WHEN** un pedido en estado "pendiente" se cancela
- **THEN** el sistema SHALL incrementar el stock de cada producto del pedido en la cantidad que fue solicitada

#### Scenario: Stock no se restaura dos veces
- **WHEN** se intenta cancelar un pedido ya cancelado
- **THEN** el sistema SHALL rechazar la transición por estado terminal, previniendo la doble restauración de stock

### Requirement: Audit trail append-only
El sistema SHALL garantizar que el historial de cambios de estado sea inmutable (append-only): una vez registrada una entrada en `PedidoHistorial`, no puede ser modificada ni eliminada.

#### Scenario: Historial crece con cada transición
- **WHEN** un pedido transiciona de "pendiente" a "pagado" y luego a "preparando"
- **THEN** el sistema SHALL tener dos entradas de historial: una para cada transición, cada una con su timestamp y descripción correspondiente

#### Scenario: No existe endpoint de modificación de historial
- **WHEN** un usuario (incluyendo admin) intenta modificar o eliminar una entrada del historial
- **THEN** el sistema SHALL no exponer ningún endpoint PUT, PATCH o DELETE para PedidoHistorial

### Requirement: Endpoint único de transición
El sistema SHALL exponer un endpoint `POST /api/v1/pedidos/{id}/transicion` que reciba la acción a ejecutar y aplique la transición correspondiente según la FSM.

#### Scenario: Transición exitosa retorna pedido actualizado
- **WHEN** un usuario autorizado envía POST /api/v1/pedidos/{id}/transicion con body `{"accion": "pagar"}`
- **THEN** el sistema SHALL retornar 200 con el pedido completo actualizado (incluyendo nuevo estado, items e historial actualizado)

#### Scenario: Acción inválida retorna error 400
- **WHEN** un usuario envía POST /api/v1/pedidos/{id}/transicion con una acción que no existe en el mapa de transiciones
- **THEN** el sistema SHALL retornar error 400 con mensaje "Acción no válida: <accion>. Acciones permitidas: pagar, preparar, enviar, entregar, cancelar"

#### Scenario: Locking pesimista en transición
- **WHEN** dos requests simultáneas intentan transicionar el mismo pedido
- **THEN** el sistema SHALL usar SELECT FOR UPDATE para evitar condiciones de carrera, permitiendo solo la primera transición y rechazando la segunda con el estado actualizado
