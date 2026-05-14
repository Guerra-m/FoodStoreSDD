# payment-processing Specification

## Purpose

Integrar MercadoPago Checkout API con CardPayment embebido. El backend crea preferencias de pago, el frontend renderiza el componente, y el webhook IPN confirma el pago para transicionar el pedido.

## Requirements

### Requirement: Creación de preferencia de pago

El backend SHALL crear una preferencia de pago en MercadoPago al confirmar un pedido, y retornar el `preference_id` al frontend para renderizar CardPayment.

#### Scenario: Creación exitosa de preferencia

- **GIVEN** un pedido confirmado en estado "pendiente"
- **WHEN** el backend solicita crear una preferencia a MP Checkout API con `items`, `external_reference=pedido_id` y `notification_url`
- **THEN** el backend SHALL retornar 201 con `preference_id` y `init_point`
- **AND** SHALL registrar el `preference_id` en el pedido

#### Scenario: Error de MP API

- **WHEN** la API de MercadoPago retorna un error (timeout, credenciales inválidas, etc.)
- **THEN** el backend SHALL retornar error 502 con mensaje "Error al crear preferencia de pago"
- **AND** SHALL registrar el error para diagnóstico

### Requirement: Idempotency en creación de pago

Cada intento de pago SHALL incluir un `idempotency_key` UUID único. La base de datos SHALL imponer una constraint UNIQUE sobre `idempotency_key` para prevenir cargos duplicados.

#### Scenario: Primer intento procesado exitosamente

- **GIVEN** un webhook IPN con `idempotency_key` nuevo
- **WHEN** el sistema procesa el webhook
- **THEN** SHALL crear un registro `Pago` con ese `idempotency_key`
- **AND** SHALL proceder con la transición de estado

#### Scenario: Webhook duplicado rechazado

- **GIVEN** un `idempotency_key` ya existente en la tabla `Pago`
- **WHEN** el sistema recibe un segundo webhook con el mismo `idempotency_key`
- **THEN** SHALL retornar 200 (no 409) sin crear un nuevo registro ni ejecutar la transición nuevamente

### Requirement: Validación de webhook IPN

El sistema SHALL exponer un endpoint `POST /api/v1/pagos/webhook` que valide la firma X-Signature HMAC-SHA256 antes de procesar el payload.

#### Scenario: X-Signature válida

- **GIVEN** un request POST al webhook con header `X-Signature` válido (firma HMAC-SHA256 generada con el secreto del merchant)
- **WHEN** el sistema valida la firma
- **THEN** SHALL procesar el payload según `topic=payment`
- **AND** SHALL retornar 200

#### Scenario: X-Signature inválida

- **GIVEN** un request POST al webhook con header `X-Signature` inválido o ausente
- **WHEN** el sistema valida la firma
- **THEN** SHALL rechazar con 401 Unauthorized
- **AND** SHALL NO procesar el payload

#### Scenario: topic no soportado

- **GIVEN** un webhook con `topic` distinto de `payment` (ej. `merchant_order`)
- **WHEN** el sistema recibe el payload
- **THEN** SHALL retornar 200 (acknowledge) sin procesar

### Requirement: Transición FSM por webhook

Al recibir un webhook con `status=approved` para un `external_reference=pedido_id`, el sistema SHALL invocar `transicionar_estado(accion="pagar")` con rol Sistema.

#### Scenario: Webhook approved transiciona pedido

- **GIVEN** un pedido existente en estado "pendiente"
- **WHEN** el sistema recibe un webhook con `topic=payment`, `status=approved`, `external_reference={pedido_id}`
- **THEN** el sistema SHALL crear el registro Pago con `mp_status=approved`
- **AND** SHALL invocar `transicionar_estado(accion="pagar")` como rol Sistema
- **AND** SHALL retornar 200

#### Scenario: Webhook rejected no transiciona

- **GIVEN** un pedido existente en estado "pendiente"
- **WHEN** el sistema recibe un webhook con `status=rejected` o `status=failed`
- **THEN** el sistema SHALL crear el registro Pago con el estado correspondiente
- **AND** SHALL NO invocar `transicionar_estado`
- **AND** SHALL retornar 200

### Requirement: Race condition — webhook antes que pedido

El sistema SHALL tolerar webhooks que lleguen antes de que el pedido esté confirmado en base de datos, retornando 202 y reintentando con backoff.

#### Scenario: Webhook llega antes del pedido

- **GIVEN** un webhook con `external_reference={pedido_id}` que aún no existe en la base de datos
- **WHEN** el sistema busca el pedido y no lo encuentra
- **THEN** SHALL retornar 202 Accepted
- **AND** SHALL registrar el webhook para reintento con backoff exponencial (ej. 1s, 4s, 16s, max 3 reintentos)

#### Scenario: Pedido nunca llega

- **GIVEN** un webhook registrado para reintento con `external_reference` que nunca se materializa
- **WHEN** se agotan los reintentos
- **THEN** SHALL marcar el webhook como `failed` en el log de diagnóstico
- **AND** SHALL notificar al admin para intervención manual

### Requirement: Modelo Pago y tracking de estado

El sistema SHALL persistir cada pago en un modelo `Pago` con los campos `mp_payment_id`, `mp_status`, `status_detail`, `idempotency_key`, `pedido_id`, y `preference_id`.

#### Scenario: Pago creado con todos los campos

- **GIVEN** un webhook IPN válido procesado exitosamente
- **WHEN** el sistema crea el registro Pago
- **THEN** SHALL guardar `mp_payment_id` del payload, `mp_status`, `status_detail`, `idempotency_key`, y `pedido_id` vinculado
- **AND** SHALL retornar el Pago creado

#### Scenario: Consulta de estado de pago

- **WHEN** un admin o cliente consulta un pedido con Pago asociado
- **THEN** el sistema SHALL incluir el estado del pago (`mp_status`, `status_detail`) en la respuesta del pedido
