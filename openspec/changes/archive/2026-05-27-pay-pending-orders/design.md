## Context

El modal de detalle de pedidos en `MisPedidos.tsx` muestra información del pedido (items, dirección, historial, estado) pero no permite ninguna acción cuando el pedido está pendiente de pago. El frontend ya cuenta con los componentes `PaymentForm` (CardPayment Brick de MercadoPago), `PaymentResultScreen`, y los hooks `useCreatePayment` y `usePagoByPedido` para el flujo de pago. El backend expone `POST /pagos/crear` y `GET /pagos/{pedido_id}` que ya funcionan para cualquier pedido pendiente, independientemente de si se inició desde el carrito o desde otro lado.

## Goals / Non-Goals

**Goals:**
- Agregar botón "Pagar ahora" en el modal de detalle de pedidos cuando `estado === 'pendiente'`
- Al clickear, reemplazar la vista de detalle por `PaymentForm` para procesar el pago
- Activar polling de estado de pago post-pago
- Refrescar la lista de pedidos si el pago se aprueba

**Non-Goals:**
- No se toca el backend
- No se toca el flujo de pago del carrito (CartDrawer)
- No se agrega Checkout Pro (solo CardPayment Brick, igual que en el carrito)
- No se agrega notificación push/email de pago exitoso

## Decisions

| Decisión | Opciones | Elegida | Razón |
|----------|----------|---------|-------|
| ¿CardPayment Brick o Checkout Pro? | CardPayment embebido vs redirección a MP | **CardPayment Brick** | Consistencia con el flujo existente en CartDrawer. El usuario no sale de la app. |
| ¿Dónde mostrar el pago? | Nuevo modal vs reemplazar contenido del modal actual | **Reemplazar contenido** | Evita anidar modales. Usa el mismo `div` del modal, alternando entre vista detalle y vista pago vía `showPayment`. |
| ¿Polling o WebSocket? | Polling 5s vs WS | **Polling 5s** | Mismo patrón que CartDrawer. El hook `usePagoByPedido` ya tiene polling configurable con timeout de 2min. |

## Risks / Trade-offs

- **Riesgo**: El usuario cierra el modal mientras se procesa el pago → **Mitigación**: `handleCloseModal` resetea el paymentStore y el estado `showPayment`
- **Riesgo**: Doble pago si el usuario clickea varias veces "Pagar ahora" → **Mitigación**: el `PaymentForm` se muestra una vez y el botón se deshabilita con `processing`. El backend tiene idempotency key.
- **Trade-off**: Reutilizar el mismo modal para detalle y pago mantiene la UI limpia pero pierde el detalle del pedido mientras se paga → es aceptable porque el usuario vio el detalle antes de clickear "Pagar ahora"
