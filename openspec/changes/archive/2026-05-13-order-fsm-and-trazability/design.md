## Context

El módulo `pedidos` implementa creación atómica de pedidos con UoW (change 8). Actualmente los pedidos se crean con estado `pendiente` y no tienen lógica de transición. Existen:

- `EstadoPedido` enum con 6 estados: pendiente, pagado, preparando, enviado, entregado, cancelado
- `PedidoHistorial` para tracking de cambios de estado (ya se crea la entrada inicial)
- Stock se decrementa al crear el pedido (en `service.py`)

No hay restricciones de transiciones, endpoints de cambio de estado, ni control de roles sobre las operaciones.

## Goals / Non-Goals

**Goals:**
- Implementar FSM con transiciones válidas y validación de reglas de negocio
- Endpoint único para transicionar estados con autorización por rol
- Audit trail append-only (no modificar ni eliminar entradas de historial)
- Restauración de stock al cancelar pedidos (según el estado)
- Tests unitarios e integración del FSM

**Non-Goals:**
- UI de botones de acción en frontend (se aborda en change 12 o cambio aparte)
- Integración con MercadoPago para cambio automático a `pagado` (change 10)
- Dashboard de métricas con estados de pedidos (change 11)
- Devoluciones o reembolsos post-entrega (fuera de alcance del roadmap actual)

## Decisions

### 1. Endpoint único vs múltiples endpoints para transiciones

**Decisión**: Endpoint único `POST /api/v1/pedidos/{id}/transicion` con body `{accion: string}`.

**Alternativa considerada**: Endpoints múltiples como `POST /pedidos/{id}/pagar`, `POST /pedidos/{id}/cancelar`.

**Razón**: Un solo endpoint es más mantenible, evita duplicación de middleware de autorización y validación de existencia del pedido, y centraliza la lógica FSM en un solo lugar. El action es un enum, fácil de extender.

### 2. Mapa de acciones a transiciones

```
+-------------+------------------+------------------+-------------------+
| Estado      | Acción           | Estado destino   | Quién             |
+-------------+------------------+------------------+-------------------+
| pendiente   | pagar            | pagado           | sistema / admin   |
| pendiente   | cancelar         | cancelado        | cliente / admin   |
| pagado      | preparar         | preparando       | admin             |
| pagado      | cancelar         | cancelado        | admin             |
| preparando  | enviar           | enviado          | admin             |
| preparando  | cancelar         | cancelado        | admin             |
| enviado     | entregar         | entregado        | admin             |
+-------------+------------------+------------------+-------------------+
```

**Estados terminales**: `entregado`, `cancelado` — no admiten más transiciones.

### 3. Restauración de stock al cancelar

**Decisión**: Al cancelar un pedido, restaurar el stock de todos los productos si el estado actual es `pendiente`, `pagado` o `preparando`. No restaurar si está `enviado` o `entregado` (no se puede cancelar desde esos estados).

**Razón**: El stock ya se decrementó al crear el pedido (change 8). Si se cancela antes de enviar, el producto vuelve al inventario. Si ya se envió, se maneja como incidencia separada.

### 4. Audit trail append-only

**Decisión**: `PedidoHistorial` es append-only por diseño:
- Cada transición crea una nueva entrada (ya implementado en `crear_pedido`)
- No se exponen endpoints PUT/DELETE para historial
- El historial se retorna en `GET /pedidos/{id}` y `GET /pedidos/{id}/historial`

**Razón**: El modelo ya es append-only por naturaleza (tabla de historial con FK al pedido). Solo hay que asegurar que no se expongan operaciones de modificación.

### 5. Separación del FSM en clase propia

**Decisión**: Crear `OrderFSM` como clase separada en `backend/app/modules/pedidos/fsm.py` en lugar de poner la lógica dentro de `PedidoService`.

**Alternativa considerada**: Lógica FSM inline en `PedidoService`.

**Razón**: La FSM es un patrón bien definido con su propia responsabilidad (validar transiciones). Separarla permite testearla en aislamiento, y el service solo la delega. Sigue el principio de Single Responsibility.

## Risks / Trade-offs

- **[Riesgo] Condición de carrera en transiciones**: Dos requests simultáneas podrían transicionar el mismo pedido. **Mitigación**: Usar `SELECT FOR UPDATE` al leer el pedido antes de transicionar, dentro de una transacción.
- **[Riesgo] Cancelación doble**: Si se cancela y restaura stock dos veces. **Mitigación**: Validar que el estado actual permita la transición ANTES de ejecutarla; si ya está cancelado, la FSM rechaza la operación.
- **[Trade-off] Cliente solo puede cancelar en `pendiente`**: Podría querer cancelar después de pagar pero antes de preparar. Se consideró pero se decide que post-pago requiere intervención de admin para evitar abusos y coordinar reembolso (change 10).
- **[Trade-off] Transiciones manuales**: Por ahora las transiciones son manuales (admin). En change 10 se agrega la transición automática `pendiente → pagado` vía webhook de MercadoPago.
