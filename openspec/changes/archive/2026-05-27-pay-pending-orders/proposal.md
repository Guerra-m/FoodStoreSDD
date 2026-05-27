## Why

Actualmente, cuando un cliente finaliza un pedido desde el carrito y NO elige pagar en ese momento, el pedido queda en estado "pendiente" sin posibilidad de pagarlo después. El cliente puede ver el detalle del pedido en "Mis Pedidos" pero no hay ninguna acción para completar el pago. Esto fuerza al cliente a tener que hacer un nuevo pedido o contactar soporte, generando fricción y potencial pérdida de ventas.

## What Changes

- **Botón "Pagar ahora" en el modal de detalle del pedido**: si el pedido está en estado `pendiente` y no tiene un pago `approved`, mostrar un botón que permita iniciar el flujo de pago.
- **Integración de PaymentForm en MisPedidos**: al hacer click en "Pagar ahora", el modal de detalle se reemplaza por el componente `PaymentForm` (CardPayment Brick de MercadoPago) para procesar el pago con tarjeta.
- **Polling de estado de pago**: luego de enviar el pago, activar polling a `GET /pagos/{pedido_id}` cada 5 segundos hasta obtener estado terminal (`approved`/`rejected`).
- **Refetch de lista de pedidos**: si el pago se aprueba, refrescar la lista de pedidos para reflejar el nuevo estado.

## Capabilities

### New Capabilities
- *(ninguna — no se introduce una nueva capability)*

### Modified Capabilities
- `order-history`: agregar acción "Pagar pedido pendiente" desde la vista de detalle del pedido

## Impact

- **Frontend**: solo `frontend/src/pages/MisPedidos.tsx` — agregar imports de `PaymentForm`, `usePaymentStore`, `useCreatePayment`, `usePagoByPedido`, y la lógica de pago en el modal.
- **Backend**: sin cambios — los endpoints `POST /pagos/crear` y `GET /pagos/{pedido_id}` ya existen y soportan este flujo.
- **Especificaciones**: `openspec/specs/order-history/spec.md` — agregar requirement para el pago desde la vista de historial.
