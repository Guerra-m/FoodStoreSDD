## Why

El change 8 `order-creation-atomic` implementó la creación de pedidos con validación atómica, pero los pedidos actualmente se crean con estado `pendiente` y nunca transicionan a otros estados. Sin una máquina de estados formal que controle las transiciones, no hay forma de gestionar el flujo operativo: pago, preparación, envío, entrega, ni cancelaciones. Esto bloquea los changes 10 (MercadoPago) y 11 (Dashboard de métricas).

## What Changes

- Implementar **FSM (Finite State Machine)** para el ciclo de vida de pedidos con transiciones válidas y validación de reglas de negocio
- Agregar **endpoints REST** para transicionar estados con autorización por rol (cliente vs admin)
- Establecer el **audit trail** como **append-only**: una vez registrada una transición, no se puede modificar ni eliminar
- Agregar **restauración de stock** al cancelar pedidos
- Prevenir transiciones inválidas (ej. de `entregado` volver a `pendiente`)
- Definir claramente **quién puede hacer cada transición** (cliente, admin, sistema)

## Capabilities

### New Capabilities
*(Ninguna nueva — todo es modificación de order-management)*

### Modified Capabilities
- `order-management`: Agregar reglas de FSM (transiciones permitidas, validaciones por rol), endpoints de transición de estado, y política de audit trail append-only

## Impact

- **Modelos**: `PedidoHistorial` ya existe, puede requerir ajustes menores (ej. hacer append-only forzado)
- **Service**: Agregar lógica FSM con validación de transiciones; `crear_pedido` ya registra estado inicial correctamente
- **Router**: Agregar endpoints `POST /pedidos/{id}/transicion` (o endpoints específicos por acción)
- **Frontend**: Botones de acción según rol y estado (postergan a cambio de UI futura o se incluyen aquí)
- **Stock**: Agregar lógica de restauración de stock al cancelar (solo si corresponde según el estado)
- **No rompe cambios existentes**: los pedidos existentes mantienen su estado actual
