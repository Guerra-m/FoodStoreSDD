# admin-order-management Specification

## Purpose
Gestión de pedidos para administradores, permitiendo listar todos los pedidos con filtros y cambiar el estado de los mismos.

## ADDED Requirements

### Requirement: Listar pedidos (admin)
El sistema SHALL proveer un endpoint `GET /admin/orders` que liste todos los pedidos del sistema con paginación y filtros.

#### Scenario: Listado paginado
- **WHEN** un admin solicita `GET /admin/orders?page=1&per_page=20`
- **THEN** el sistema SHALL devolver una página con pedidos incluyendo id, nombre del cliente, total, estado, fecha de creación y cantidad de items, más el total de pedidos

#### Scenario: Filtro por estado
- **WHEN** un admin solicita `GET /admin/orders?status=pendiente`
- **THEN** el sistema SHALL devolver solo los pedidos con ese estado

#### Scenario: Filtro por rango de fechas
- **WHEN** un admin solicita `GET /admin/orders?date_from=2026-01-01&date_to=2026-01-31`
- **THEN** el sistema SHALL devolver pedidos creados dentro del rango de fechas especificado

#### Scenario: Filtro por cliente
- **WHEN** un admin solicita `GET /admin/orders?cliente_id=5`
- **THEN** el sistema SHALL devolver solo los pedidos de ese cliente

### Requirement: Obtener detalle de pedido (admin)
El sistema SHALL proveer un endpoint `GET /admin/orders/{id}` con el detalle completo de un pedido.

#### Scenario: Detalle completo
- **WHEN** un admin solicita un pedido existente
- **THEN** el sistema SHALL devolver: datos del pedido, items con snapshots, historial de cambios de estado, información del pago (si existe), y datos del cliente

#### Scenario: Pedido no encontrado
- **WHEN** un admin solicita un ID de pedido inexistente
- **THEN** el sistema SHALL devolver un error 404 (Not Found)

### Requirement: Cambiar estado de pedido (admin)
El sistema SHALL proveer un endpoint `PUT /admin/orders/{id}/status` para que un admin pueda cambiar el estado de un pedido, respetando las transiciones válidas del FSM.

#### Scenario: Cambio de estado exitoso
- **WHEN** un admin envía un estado válido según el FSM para un pedido existente
- **THEN** el sistema SHALL actualizar el estado del pedido, crear un registro en pedido_historial, y si corresponde (confirmación/cancelación), actualizar el stock

#### Scenario: Transición inválida
- **WHEN** un admin envía un estado que no es una transición válida desde el estado actual
- **THEN** el sistema SHALL devolver un error 400 (Bad Request) indicando la transición no permitida

### Requirement: Frontend de gestión de pedidos
El sistema SHALL mostrar una página `/admin/orders` con la lista de pedidos y capacidad de gestión.

#### Scenario: Tabla de pedidos con filtros
- **WHEN** un Admin navega a `/admin/orders`
- **THEN** el sistema SHALL mostrar una tabla paginada con columnas: ID, cliente, total, estado (con badge de color), fecha. Con filtros por estado y búsqueda

#### Scenario: Detalle de pedido
- **WHEN** un Admin hace click en un pedido
- **THEN** el sistema SHALL mostrar el detalle completo incluyendo items, historial de cambios, e información de pago

#### Scenario: Cambiar estado desde UI
- **WHEN** un Admin ve el detalle de un pedido
- **THEN** el sistema SHALL mostrar un selector de estados con solo las transiciones válidas según el FSM, y un botón para aplicar el cambio

#### Scenario: Confirmación de cambio de estado
- **WHEN** un Admin selecciona un nuevo estado y hace click en aplicar
- **THEN** el sistema SHALL mostrar un diálogo de confirmación con el cambio propuesto antes de ejecutarlo
