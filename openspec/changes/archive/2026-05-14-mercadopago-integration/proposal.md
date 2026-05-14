## Why

Integrar MercadoPago como gateway de pago es esencial para cerrar el ciclo comercial del Food Store. Actualmente los pedidos se crean con estado "pendiente" pero no existe forma de cobrarlos. Sin pagos, el sistema es un catálogo glorificado. Esta integración permite a los clientes pagar con los medios disponibles en MercadoPago (tarjetas, transferencias, etc.) y al negocio recibir la confirmación de cobro vía webhooks, habilitando así las transiciones de la FSM hacia "pagado".

## What Changes

- Nuevo módulo de pagos con integración a la Checkout API de MercadoPago (creación de preferencias)
- Endpoint `POST /api/v1/pedidos/{id}/preferencia-pago` para generar preferencia de pago a partir de un pedido pendiente
- Procesamiento de Webhooks IPN (Instant Payment Notification) de MercadoPago en `POST /api/v1/webhooks/mercadopago`
- Sistema de idempotencia para evitar procesar notificaciones duplicadas
- Actualización automática del estado del pedido vía FSM al confirmarse el pago
- Registro de transacciones de pago con payment_id, estado, metadata y relación con el pedido
- Esquema de base de datos para persistir transacciones de pago
- Manejo de errores y reintentos ante fallos de comunicación con MercadoPago

## Capabilities

### New Capabilities
- `payment-processing`: Integración con MercadoPago Checkout API, creación de preferencias de pago, manejo de webhooks IPN, idempotencia de notificaciones, registro de transacciones, y gestión de estados de pago (pendiente, aprobado, rechazado, etc.).

### Modified Capabilities
- `order-management`: Los pedidos en estado "pendiente" deberán poder asociarse a una preferencia de pago y transacciones. La FSM de pedidos deberá integrar la transición automática a "pagado" cuando se confirme el pago vía webhook, y exponer el estado de pago en la respuesta del pedido.

## Impact

- **Backend**: Nuevo módulo `payments/` con sub-módulos `mercadopago/` (integración con API), `webhooks/` (IPN handling), `models/` (transacciones), `schemas/` (request/response)
- **Backend**: Modificar módulo `order-management` para integrar FSM con confirmación de pago y exponer estado de pago en endpoints
- **Backend**: Migración de BD para tabla `pago_transacciones` con idempotency_key
- **Config**: Agregar variables de entorno: `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_PUBLIC_KEY`, `MERCADOPAGO_WEBHOOK_SECRET`, `MERCADOPAGO_WEBHOOK_URL`
- **Dependencias**: Instalar SDK oficial `mercadopago` (Python)
- **Frontend**: Nuevo flujo de checkout con botón de pago que redirige a MercadoPago o muestra QR/Pix; componente de estado de pago en detalle del pedido
