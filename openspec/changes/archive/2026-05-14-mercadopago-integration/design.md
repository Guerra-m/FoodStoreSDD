## Context

FoodStore ya cuenta con un sistema de pedidos con FSM (pendiente → pagado → preparando → enviado → entregado) y un flujo de creación atómica con Unit of Work. Sin embargo, no existe integración con ningún gateway de pago: los pedidos quedan en "pendiente" sin posibilidad de cobrarlos.

MercadoPago es el gateway más utilizado en Argentina/Latam. Su Checkout API permite crear preferencias de pago (redirect, QR, Pix) y notificar cambios de estado vía IPN (Instant Payment Notification) webhooks.

Actualmente contamos con:
- Módulo `order-management` con FSM, historial append-only y autorización por rol
- Patrón Unit of Work para atomicidad
- Repositorio base con CRUD estándar
- PostgreSQL como base de datos

## Goals / Non-Goals

**Goals:**
- Integrar MercadoPago Checkout API para creación de preferencias de pago
- Procesar notificaciones IPN (webhooks) de MercadoPago de forma segura e idempotente
- Actualizar automáticamente el estado del pedido a "pagado" vía FSM cuando se confirme el pago
- Registrar todas las transacciones de pago en base de datos (payment_id, estado, metadata)
- Exponer información de pago en los endpoints de detalle de pedido
- Proveer endpoint para generar preferencia de pago desde un pedido pendiente

**Non-Goals:**
- Reembolsos / cancelaciones de pago (se hará manualmente desde el panel de MercadoPago por ahora)
- Suscripciones o pagos recurrentes con MercadoPago
- Múltiples pagos parciales para un mismo pedido
- Métodos de pago alternativos (efectivo, transferencia directa, etc.)
- Marketplace / split de pagos entre múltiples cuentas

## Decisions

### 1. SDK oficial de MercadoPago (Python) vs REST API directa
**Decisión:** Usar SDK oficial `mercadopago==2.x`
**Por qué:** El SDK abstrae la complejidad de firmas, serialización y manejo de errores de la API REST. Si en el futuro necesitamos features no cubiertas por el SDK, podemos caer a REST directo. El SDK es mantenido por MercadoPago y tiene soporte activo.

### 2. Idempotencia vía unique constraint en base de datos
**Decisión:** Unique constraint sobre `(mercadopago_payment_id, tipo_evento)` en la tabla `pago_transacciones`
**Por qué:** MercadoPago puede enviar el mismo webhook múltiples veces (especialmente en el modelo IPN). Con esta constraint, el segundo INSERT falla silenciosamente (ON CONFLICT DO NOTHING) sin procesar duplicados. Es más simple y robusto que mantener una tabla de idempotency keys externas.

### 3. Webhook processing dentro de UoW
**Decisión:** Cada notificación IPN se procesa dentro de una transacción de base de datos usando el Unit of Work existente
**Por qué:** Garantizamos atomicidad: si falla la actualización del pedido o el registro de la transacción, todo se revierte. Evitamos estados inconsistentes donde el pago se registra pero el pedido no se actualiza.

### 4. Modelo de datos separado para transacciones
**Decisión:** Tabla `pago_transacciones` con FK a `pedidos`, no campos embebidos en `pedidos`
**Por qué:** Un pedido puede tener múltiples intentos de pago (el primero rechazado, el segundo aprobado). Con tabla separada mantenemos el historial completo sin contaminar el modelo de pedido.

### 5. Secret key en vez de access token para webhooks
**Decisión:** Usar `x-webhook-secret` (X-Signature) para validar que los webhooks vienen de MercadoPago
**Por qué:** Es el mecanismo recomendado por MercadoPago para verificar la autenticidad de las notificaciones. Sin esta validación, cualquiera podría enviar webhooks falsos y marcar pedidos como pagados.

### 6. Transición FSM vía servicio existente
**Decisión:** El webhook handler usa el servicio `OrderFSMService` existente para ejecutar la transición a "pagado"
**Por qué:** Reutilizamos la lógica ya implementada de FSM, historial append-only y autorización. No duplicamos reglas de negocio.

## Risks / Trade-offs

| Riesgo | Mitigación |
|--------|------------|
| **Webhook duplicado** por reintento de MercadoPago (IPN entrega al menos 1 vez, a veces múltiples) | Unique constraint `(mercadopago_payment_id, tipo_evento)` + ON CONFLICT DO NOTHING |
| **Webhook no recibido** por caída del servidor o error de red | Endpoint `GET /api/v1/pedidos/{id}/pago/status` permite consultar estado actual; se puede implementar polling schedule más adelante |
| **Webhook malicioso** (alguien falsifica una notificación de pago) | Validación de firma HMAC con `MERCADOPAGO_WEBHOOK_SECRET`; además la transición FSM valida que el pedido esté en "pendiente" |
| **MercadoPago API caída** al momento de crear preferencia | El error se propaga al cliente; el pedido queda en "pendiente" sin pérdida de datos. El usuario puede reintentar |
| **Pago rechazado después de creada la preferencia** | La preferencia sigue siendo válida; el cliente puede reintentar el pago desde MercadoPago |
| **Concurrencia en webhooks** (dos notificaciones simultáneas para el mismo pago) | El UoW con SELECT FOR UPDATE en la FSM previene condiciones de carrera; la unique constraint maneja el duplicado |
