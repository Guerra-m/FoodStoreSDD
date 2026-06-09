## ADDED Requirements

### Requirement: Creación atómica de pedidos
El sistema SHALL crear pedidos de forma atómica, garantizando que todos los pasos se completen exitosamente o se reviertan completamente en caso de fallo.

#### Scenario: Crear pedido exitosamente
- **WHEN** un cliente autenticado envía una solicitud de pedido con items del carrito y una dirección de entrega válida
- **THEN** el sistema SHALL crear el pedido con todos los items, guardar snapshots de precios y dirección, y registrar el historial inicial con estado "pendiente"
- **AND** SHALL retornar 201 con los datos del pedido creado

#### Scenario: Fallo por producto inactivo
- **WHEN** un cliente intenta crear un pedido con un producto que fue desactivado después de agregarlo al carrito
- **THEN** el sistema SHALL rechazar el pedido con error 400 indicando que uno o más productos ya no están disponibles

#### Scenario: Fallo por stock insuficiente
- **WHEN** un cliente intenta crear un pedido pero el stock de algún producto es menor a la cantidad solicitada
- **THEN** el sistema SHALL rechazar el pedido con error 400 indicando el producto(s) sin stock suficiente

#### Scenario: Fallo por precio cambiado
- **WHEN** un cliente intenta crear un pedido pero el precio de algún producto cambió desde que lo agregó al carrito
- **THEN** el sistema SHALL rechazar el pedido con error 400 indicando el precio actualizado del producto

#### Scenario: Fallo por dirección inexistente
- **WHEN** un cliente intenta crear un pedido con una dirección de entrega que ya no existe
- **THEN** el sistema SHALL rechazar el pedido con error 400 indicando que la dirección no es válida

### Requirement: Validación de stock con locking
El sistema SHALL validar la disponibilidad de stock al momento de crear el pedido, usando locking para prevenir condiciones de carrera.

#### Scenario: Dos clientes compran último item simultáneamente
- **WHEN** dos clientes intentan comprar el último unit de un producto al mismo tiempo
- **THEN** el sistema SHALL aceptar solo la primera solicitud y rechazar la segunda con error de stock insuficiente

#### Scenario: Stock actualizado durante validación
- **WHEN** el stock de un producto cambia mientras se procesa un pedido
- **THEN** el sistema SHALL usar el stock más reciente disponible al momento de validar

### Requirement: Snapshots de precio
El sistema SHALL guardar el precio unitario y el subtotal de cada item al momento de crear el pedido, independientemente de cambios futuros en el catálogo.

#### Scenario: Pedido muestra precios históricos
- **WHEN** un cliente visualiza un pedido creado anteriormente
- **THEN** el sistema SHALL mostrar los precios que tenía cada producto en el momento de la compra, no los precios actuales

#### Scenario: Cálculo correcto de totales
- **WHEN** el sistema calcula el total de un pedido
- **THEN** SHALL usar la fórmula: Σ(cada item: precio_unitario × cantidad)

### Requirement: Snapshot de dirección
El sistema SHALL guardar una copia completa de la dirección de entrega en el momento de crear el pedido.

#### Scenario: Pedido mantiene dirección original
- **WHEN** un cliente crea un pedido y luego modifica la dirección de entrega
- **THEN** el sistema SHALL mantener la dirección original en el pedido sin cambios

#### Scenario: Dirección del pedido accesible después de eliminar dirección original
- **WHEN** un cliente elimina una dirección que fue usada en un pedido anterior
- **THEN** el sistema SHALL seguir mostrando la dirección del pedido (datos históricos)

### Requirement: Estado inicial del pedido
El sistema SHALL registrar automáticamente el estado inicial "pendiente" al crear un pedido.

#### Scenario: Pedido creado con estado pendiente
- **WHEN** un pedido se crea exitosamente
- **THEN** el sistema SHALL registrar en el historial: estado="pendiente", timestamp actual, descripción "Pedido creado"

### Requirement: Listar pedidos del cliente
El sistema SHALL permitir a los clientes autenticados listar sus propios pedidos.

#### Scenario: Cliente lista sus pedidos
- **WHEN** un cliente autenticado solicita GET /api/v1/pedidos
- **THEN** el sistema SHALL retornar una lista paginada de pedidos del cliente, ordenados por fecha descendente (más recientes primero)

#### Scenario: Cliente ve detalle de un pedido
- **WHEN** un cliente autenticado solicita GET /api/v1/pedidos/{id}
- **THEN** el sistema SHALL retornar los detalles completos del pedido incluyendo items, dirección snapshot, y estado actual

#### Scenario: Cliente intenta ver pedido de otro cliente
- **WHEN** un cliente autenticado intenta acceder a un pedido que no le pertenece
- **THEN** el sistema SHALL retornar 404 (no revelar que el pedido existe)

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

#### Scenario: Cocinero puede iniciar preparación

- **WHEN** un usuario con rol Cocinero autenticado solicita transicionar un pedido en estado "pagado" con acción "preparar"
- **THEN** el sistema SHALL cambiar el estado del pedido a "preparando" y registrar el historial con descripción "Preparación iniciada"

#### Scenario: Cocinero puede marcar pedido como enviado

- **WHEN** un usuario con rol Cocinero autenticado solicita transicionar un pedido en estado "preparando" con acción "enviar"
- **THEN** el sistema SHALL cambiar el estado del pedido a "enviado" y registrar el historial con descripción "Pedido enviado"

#### Scenario: Cocinero no puede entregar pedidos

- **WHEN** un usuario con rol Cocinero autenticado solicita transicionar un pedido en estado "enviado" con acción "entregar"
- **THEN** el sistema SHALL rechazar la operación con error 403

#### Scenario: Cocinero no puede cancelar pedidos en preparación

- **WHEN** un usuario con rol Cocinero autenticado solicita transicionar un pedido en estado "preparando" con acción "cancelar"
- **THEN** el sistema SHALL rechazar la operación con error 403

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
- **THEN** el sistema SHALL cambiar el estado del pedido a "entregado" y registrar el historial con descripción "Pedido enviado"

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

#### Scenario: Cocinero puede cancelar pedidos en pendiente

- **WHEN** un usuario con rol Cocinero autenticado solicita cancelar un pedido en estado "pendiente"
- **THEN** el sistema SHALL permitir la operación y restaurar el stock

#### Scenario: Cocinero puede cancelar pedidos en pagado

- **WHEN** un usuario con rol Cocinero autenticado solicita cancelar un pedido en estado "pagado"
- **THEN** el sistema SHALL permitir la operación y restaurar el stock
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

### Requirement: Tracking en tiempo real vía WebSocket

El sistema SHALL exponer un endpoint WebSocket que permita a los clientes suscribirse a cambios de estado de un pedido en tiempo real. Tras cada transición exitosa (`POST /transicion`), el sistema SHALL broadcastear el nuevo estado a todos los clientes suscriptos.

#### Scenario: Cliente se conecta al WebSocket de un pedido propio

- **WHEN** un cliente autenticado conecta `WS /api/v1/pedidos/ws/{pedido_id}?token={jwt}` con un token válido y el pedido le pertenece
- **THEN** el sistema SHALL aceptar la conexión y suscribir al cliente a cambios de ese pedido

#### Scenario: Token inválido es rechazado

- **WHEN** un cliente intenta conectar al WebSocket con un token JWT inválido o expirado
- **THEN** el sistema SHALL cerrar la conexión con código 4001

#### Scenario: Cliente no autorizado es rechazado

- **WHEN** un cliente intenta conectar al WebSocket de un pedido que no le pertenece (sin ser Admin)
- **THEN** el sistema SHALL cerrar la conexión con código 4003

#### Scenario: Admin puede ver cualquier pedido vía WebSocket

- **WHEN** un admin autenticado conecta al WebSocket de cualquier pedido
- **THEN** el sistema SHALL aceptar la conexión sin verificar propietario

#### Scenario: Transición genera evento WebSocket

- **GIVEN** al menos un cliente conectado al WebSocket del pedido
- **WHEN** se ejecuta una transición exitosa (`POST /transicion`)
- **THEN** el sistema SHALL enviar un evento JSON a todos los clientes suscriptos con: `type`, `pedido_id`, `estado_anterior`, `estado_nuevo`, `descripcion`, `timestamp`, `historial`

#### Scenario: Cliente desconectado no recibe broadcast

- **GIVEN** un cliente previamente conectado al WebSocket
- **WHEN** el cliente se desconecta y luego ocurre una transición
- **THEN** el sistema SHALL remover la conexión caída de la lista de suscriptores sin error

#### Scenario: Conexión caída con fallback a polling

- **GIVEN** un cliente viendo el tracking de un pedido
- **WHEN** la conexión WebSocket se pierde y no puede reconectarse tras 5 intentos
- **THEN** el frontend SHALL activar polling cada 30s como mecanismo de fallback