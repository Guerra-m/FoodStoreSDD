## Why

Cuando un usuario crea un pedido pero no lo paga en el momento (elige "Después" en el checkout), no hay forma de pagarlo después. El pedido queda en "pendiente" para siempre desde la perspectiva del usuario. Esto corta el ciclo de conversión: el usuario quiere comprar pero no puede completar el pago si se va del checkout.

## What Changes

- En el modal de detalle de pedido de **Mis Pedidos**, cuando el pedido esté en estado "pendiente", se agrega un botón **"Pagar ahora"**
- Al hacer clic, se muestra el formulario de pago con MercadoPago CardPayment brick directamente en el modal, sin redirigir a otra página
- El flujo de pago reutiliza el backend existente (`POST /api/v1/pagos/crear`) y el polling de estado (`GET /api/v1/pagos/{pedido_id}`)
- Al pagar exitosamente, el modal muestra la confirmación y al cerrarlo se refresca la lista de pedidos
- No se modifican rutas, backend, ni componentes existentes fuera de MisPedidos

## Capabilities

### New Capabilities
- *(ninguna — no se introduce una nueva capability, se modifica la existente)*

### Modified Capabilities
- `order-history`: El detalle de pedido en MisPedidos SHALL permitir al cliente pagar un pedido en estado "pendiente" directamente desde la vista de detalle

## Impact

- **Frontend**: Solo se modifica `frontend/src/pages/MisPedidos.tsx` — se agrega estado local de pago, botón "Pagar ahora", y renderizado condicional de `PaymentForm`
- **Backend**: Sin cambios — los endpoints existentes (`POST /api/v1/pagos/crear`, `GET /api/v1/pagos/{pedido_id}`) ya soportan el flujo para cualquier pedido
- **Router**: Sin cambios — no se agregan nuevas rutas
- **Componentes existentes**: `PaymentForm.tsx`, `useCreatePayment`, `usePagoByPedido`, `paymentStore` — se reutilizan sin modificaciones
