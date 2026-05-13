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