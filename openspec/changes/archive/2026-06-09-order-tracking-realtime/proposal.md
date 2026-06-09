# Change Proposal: Order Tracking Realtime

## ¿Qué?

Sistema de tracking en tiempo real para pedidos usando WebSockets. Cuando un administrador transiciona un pedido (pendiente → pagado → preparando → enviado → entregado), el cliente ve el cambio instantáneamente sin tener que recargar la página.

Incluye:
- Dashboard de tracking visual para el cliente (barra de progreso con estados)
- WebSockets en backend para broadcast de cambios de estado
- Polling como fallback si WebSocket falla
- Badge/indicador de estado en la lista de "Mis Pedidos"

## ¿Por qué?

Hoy el cliente no tiene visibilidad del progreso de su pedido. La única forma de saber el estado es entrar a "Mis Pedidos" y recargar manualmente. Esto:

1. **Mala UX**: El usuario no sabe si su pedido ya está en preparación, enviado, etc.
2. **Soporte innecesario**: El usuario va a contactar al local para preguntar "¿cómo va mi pedido?"
3. **No profesional**: Una app de comida sin tracking en tiempo real se siente incompleta

## Alcance

### Incluye
- WebSocket endpoint en FastAPI (`/api/v1/ws/pedidos/{pedido_id}`)
- Broadcast de eventos cuando el estado cambia vía `POST /transicion`
- Dashboard de tracking con barra de progreso visual
- Reconexión automática del WebSocket
- Polling como fallback (React Query `refetchInterval` 30s)
- Badge de estado en lista "Mis Pedidos"
- Soporte para que el admin también vea cambios en tiempo real (OrdersPage)

### No incluye
- Notificaciones push (email, WhatsApp, etc.) — eso queda para Change 22
- WebSockets para otras entidades (productos, usuarios, etc.)
- Persistencia de eventos WebSocket (es solo broadcast en vivo)

## Dependencias

- Change 9 (order-fsm-and-trazability) ✅ — FSM de pedidos
- Change 20 (fix-session-loop) ✅ — Sesión estable para auth
