# payment-processing Specification

## Purpose
Gestión de pagos online mediante integración con MercadoPago Checkout API, incluyendo creación de preferencias de pago, procesamiento de notificaciones IPN (webhooks), sistema de idempotencia, y registro de transacciones.

## Requirements

### Requirement: Crear preferencia de pago
El sistema SHALL exponer un endpoint `POST /api/v1/pedidos/{id}/preferencia-pago` que cree una preferencia de pago en MercadoPago para un pedido en estado "pendiente" perteneciente al cliente autenticado.

#### Scenario: Crear preferencia exitosamente
- **WHEN** un cliente autenticado solicita crear una preferencia de pago para su propio pedido en estado "pendiente"
- **THEN** el sistema SHALL crear una preferencia en MercadoPago vía SDK con los items del pedido (descripción, monto unitario, cantidad)
- **AND** SHALL almacenar el `mercadopago_preference_id`, `init_point` (URL de checkout) y `expiration_date` en la tabla `pago_transacciones`
- **AND** SHALL retornar 201 con la URL de checkout (`init_point`) y el ID de la preferencia

#### Scenario: Pedido no pertenece al cliente
- **WHEN** un cliente autenticado solicita crear preferencia para un pedido que no le pertenece
- **THEN** el sistema SHALL retornar 404 (no revelar existencia del pedido)

#### Scenario: Pedido no está en estado pendiente
- **WHEN** un cliente autenticado solicita crear preferencia para un pedido que no está en estado "pendiente"
- **THEN** el sistema SHALL retornar error 400 con mensaje "El pedido debe estar en estado pendiente para generar un pago"

#### Scenario: Ya existe preferencia activa
- **WHEN** un cliente solicita crear preferencia para un pedido que ya tiene una preferencia activa (no expirada, no pagada)
- **THEN** el sistema SHALL retornar la preferencia existente en lugar de crear una nueva

#### Scenario: Error de conexión con MercadoPago
- **WHEN** el servicio de MercadoPago no está disponible al crear la preferencia
- **THEN** el sistema SHALL retornar error 502 con mensaje "El servicio de pago no está disponible. Intente nuevamente."

### Requirement: Procesar webhook IPN de MercadoPago
El sistema SHALL exponer un endpoint `POST /api/v1/webhooks/mercadopago` que reciba notificaciones IPN de MercadoPago y procese los cambios de estado de pago.

#### Scenario: Notificación de pago aprobado
- **WHEN** MercadoPago envía un webhook con `topic=payment` y `status=approved`
- **THEN** el sistema SHALL consultar el detalle del pago vía API de MercadoPago usando el `payment_id`
- **AND** SHALL registrar la transacción en `pago_transacciones` con estado "aprobado"
- **AND** SHALL ejecutar la transición FSM del pedido a estado "pagado" con descripción "Pago confirmado vía MercadoPago"
- **AND** SHALL retornar 200 OK

#### Scenario: Notificación de pago rechazado
- **WHEN** MercadoPago envía un webhook con `topic=payment` y `status=rejected`
- **THEN** el sistema SHALL registrar la transacción en `pago_transacciones` con estado "rechazado" y el motivo del rechazo
- **AND** SHALL mantener el pedido en estado "pendiente" para permitir un nuevo intento de pago
- **AND** SHALL retornar 200 OK

#### Scenario: Notificación de pago pendiente
- **WHEN** MercadoPago envía un webhook con `topic=payment` y `status=pending` o `in_process`
- **THEN** el sistema SHALL registrar la transacción en `pago_transacciones` con el estado correspondiente
- **AND** SHALL mantener el pedido en estado "pendiente"
- **AND** SHALL retornar 200 OK

### Requirement: Idempotencia en webhooks
El sistema SHALL garantizar que cada notificación IPN se procese una sola vez, incluso si MercadoPago envía el mismo webhook múltiples veces.

#### Scenario: Webhook duplicado ignorado
- **WHEN** MercadoPago envía dos webhooks idénticos (mismo `payment_id` y mismo `tipo_evento`)
- **THEN** el sistema SHALL procesar solo el primero
- **AND** SHALL ignorar el segundo sin generar error ni modificar estado

#### Scenario: Misma transacción, diferentes eventos
- **WHEN** MercadoPago envía primero un webhook de pago "pendiente" y luego otro de pago "aprobado" para el mismo `payment_id`
- **THEN** el sistema SHALL procesar ambos eventos por separado (son diferentes `tipo_evento`)
- **AND** SHALL actualizar el estado de la transacción al más reciente

### Requirement: Validación de firma de webhook
El sistema SHALL validar la autenticidad de cada webhook recibido usando el secret compartido con MercadoPago.

#### Scenario: Firma válida
- **WHEN** el webhook incluye una firma HMAC válida generada con `MERCADOPAGO_WEBHOOK_SECRET`
- **THEN** el sistema SHALL procesar la notificación normalmente

#### Scenario: Firma inválida
- **WHEN** el webhook incluye una firma HMAC inválida o no incluye firma
- **THEN** el sistema SHALL retornar error 401 y NO procesar la notificación

### Requirement: Almacenamiento de transacciones de pago
El sistema SHALL persistir todas las transacciones de pago en la tabla `pago_transacciones` con la siguiente información mínima.

#### Scenario: Transacción almacenada correctamente
- **WHEN** se procesa cualquier notificación de pago
- **THEN** el sistema SHALL almacenar: `pedido_id` (FK), `mercadopago_payment_id`, `mercadopago_preference_id`, `estado` (pendiente/aprobado/rechazado/en_proceso), `tipo_evento`, `metadata` (JSON con respuesta completa de MP), `idempotency_key` (unique: payment_id + tipo_evento), y timestamps de creación y actualización

### Requirement: Consultar estado de pago de un pedido
El sistema SHALL permitir consultar el estado de pago de un pedido a través del endpoint existente de detalle de pedido o mediante el endpoint específico.

#### Scenario: Pedido con pago exitoso
- **WHEN** un cliente autenticado consulta GET /api/v1/pedidos/{id} de un pedido pagado
- **THEN** el sistema SHALL incluir en la respuesta: `estado_pago`, `metodo_pago` (ej. "mercadopago"), y la URL de la preferencia si está activa

#### Scenario: Pedido sin pago
- **WHEN** un cliente autenticado consulta GET /api/v1/pedidos/{id} de un pedido sin intentos de pago
- **THEN** el sistema SHALL incluir `estado_pago: null` o "no_iniciado"

### Requirement: Manejo de errores en webhooks
El sistema SHALL registrar errores de procesamiento de webhooks sin interrumpir el flujo.

#### Scenario: Error al consultar API de MercadoPago durante webhook
- **WHEN** el webhook handler no puede consultar el detalle del pago en la API de MercadoPago
- **THEN** el sistema SHALL retornar 200 OK a MercadoPago (para evitar reintentos)
- **AND** SHALL registrar el error internamente para revisión manual
- **AND** SHALL dejar el pedido en su estado actual sin modificar
