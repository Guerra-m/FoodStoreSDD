## 1. Setup y Configuración

- [x] 1.1 Agregar dependencia `mercadopago>=2.0` al `requirements.txt` del backend
- [x] 1.2 Agregar variables de entorno al archivo de configuración: `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_PUBLIC_KEY`, `MERCADOPAGO_WEBHOOK_SECRET`, `MERCADOPAGO_WEBHOOK_URL`
- [x] 1.3 Crear migración de Alembic para la tabla `pago_transacciones` con unique constraint `(mercadopago_payment_id, tipo_evento)`
- [x] 1.4 Crear el módulo `payments/` con estructura: `mercadopago/`, `webhooks/`, `models/`, `schemas/`

## 2. Modelos y Schemas

- [x] 2.1 Crear modelo SQLModel `PagoTransaccion` con campos: id (Integer), pedido_id (FK), mercadopago_payment_id, mercadopago_preference_id, estado, tipo_evento, metadata (JSON), idempotency_key (unique), timestamps
- [x] 2.2 Crear schemas Pydantic: `PreferenciaPagoResponse` (preference_id, init_point), `WebhookNotification` (topic, action, data), `PagoEstadoResponse`
- [x] 2.3 Extender `PedidoResponse` para incluir `estado_pago` y datos de pago relevantes

## 3. Servicio de Integración con MercadoPago

- [x] 3.1 Implementar `MercadoPagoClient` como wrapper del SDK: inicialización con access_token, validación de config
- [x] 3.2 Implementar método `create_preference(order)` que construye y envía la preferencia con items, back_urls, notification_url
- [x] 3.3 Implementar método `get_payment(payment_id)` para consultar estado de pago desde webhook
- [x] 3.4 Implementar utilidad `_validar_firma(headers, body)` para verificar firma HMAC de notificaciones

## 4. Endpoints API

- [x] 4.1 Implementar `POST /api/v1/pedidos/{id}/preferencia-pago`: validar pedido, crear preferencia en MP, persistir transacción, retornar URL
- [x] 4.2 Implementar `POST /api/v1/webhooks/mercadopago`: validar firma, parsear notificación, procesar según estado
- [x] 4.3 Implementar `GET /api/v1/pedidos/{id}/pago/status`: consultar estado de pago actual del pedido

## 5. Procesamiento de Webhooks

- [x] 5.1 Implementar idempotencia: idempotency_key + ON CONFLICT DO NOTHING via `crear_si_no_existe`
- [x] 5.2 Implementar handler para pago aprobado: actualizar transacción + disparar transición FSM a "pagado"
- [x] 5.3 Implementar handler para pago rechazado/pendiente: registrar transacción sin modificar pedido
- [x] 5.4 Implementar manejo de errores: retornar 200 a MP siempre, loguear errores internamente

## 6. Integración con Order Management

- [x] 6.1 Modificar `PedidoResponse` para incluir campo `estado_pago` y `preferencia_pago_url`
- [x] 6.2 Agregar transición FSM "pagar" permitida para el sistema - YA implementado (rol "Sistema" existente)
- [x] 6.3 Asegurar que el endpoint de listar pedidos incluya estado de pago en la respuesta

## 7. Frontend - Checkout y Pago

- [x] 7.1 Crear componente `PaymentButton` que llama a preferencia-pago y redirige a init_point de MercadoPago
- [x] 7.2 Crear componente `PaymentStatusBadge` para mostrar estado de pago en detalle de pedido
- [x] 7.3 Agregar flujo de checkout en la página de detalle de pedido: botón "Pagar ahora" cuando el pedido está pendiente

## 8. Tests

- [x] 8.1 Escribir tests unitarios para `MercadoPagoClient` (mockeando SDK)
- [x] 8.2 Escribir tests de integración para `POST /api/v1/pedidos/{id}/preferencia-pago`
- [x] 8.3 Escribir tests de integración para `POST /api/v1/webhooks/mercadopago` (pago aprobado, rechazado, pendiente)
- [x] 8.4 Escribir test de idempotencia: enviar mismo webhook dos veces, verificar única transacción
- [x] 8.5 Escribir test de seguridad: webhook con firma inválida debe ser rechazado con 401
