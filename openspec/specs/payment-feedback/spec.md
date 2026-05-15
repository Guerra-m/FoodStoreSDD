# payment-feedback Specification

## Purpose
Pantallas de resultado de pago pulidas y una ruta dedicada `/payment-result` para el retorno de MercadoPago, con soporte para polling de estado pendiente y flujo de reintento.

## Requirements

### Requirement: Enhanced payment result screen
The payment form SHALL display a polished result screen when a payment completes (approved, rejected, or error) instead of the basic text-and-emoji layout currently in place.

#### Scenario: Payment approved shows success screen
- **WHEN** `paymentStore.status` becomes `"approved"`
- **THEN** the system SHALL display a success screen with:
  - A large animated checkmark icon (green)
  - "¡Pago aprobado!" title
  - "Tu pago fue procesado correctamente." subtitle
  - Payment ID (`mpPaymentId`) displayed
  - "Ver mi pedido" button linking to `/mis-pedidos`
  - "Volver al catálogo" button linking to `/catalog`

#### Scenario: Payment rejected shows failure screen
- **WHEN** `paymentStore.status` becomes `"rejected"`
- **THEN** the system SHALL display a failure screen with:
  - A large X icon (red)
  - "Pago rechazado" title
  - "El pago no pudo procesarse. Intentá con otro medio de pago." subtitle
  - Status detail displayed if available
  - "Intentar de nuevo" button that resets the payment flow
  - "Volver al carrito" button

#### Scenario: Payment error shows error screen
- **WHEN** `paymentStore.status` becomes `"error"`
- **THEN** the system SHALL display an error screen with:
  - A warning icon (amber/yellow)
  - "Error de pago" title
  - The error message from the store
  - "Intentar de nuevo" button
  - "Contactar soporte" informational text

### Requirement: Payment result page route
The system SHALL provide a `/payment-result` route that displays the payment result. This route SHALL be the redirect target for MercadoPago's `back_urls` configuration (success, failure, pending return URLs).

#### Scenario: Payment result route handles MP return
- **WHEN** the user is redirected back from MercadoPago to `/payment-result?status=approved&payment_id=123&external_reference=order_456`
- **THEN** the system SHALL parse the URL parameters
- **THEN** the system SHALL update `paymentStore` with the result
- **THEN** the system SHALL display the appropriate result screen

#### Scenario: Payment result handles pending status
- **WHEN** the user returns from MercadoPago with `status=pending`
- **THEN** the system SHALL display a pending screen with:
  - A clock/hourglass icon (blue)
  - "Pago pendiente" title
  - "Tu pago está siendo procesado. Te notificaremos cuando se confirme." subtitle
  - "Ver mis pedidos" button

### Requirement: Payment status polling
The system SHALL poll the payment status when the payment result shows as "pending" to automatically update when the payment is confirmed.

#### Scenario: Polling updates pending to approved
- **WHEN** the payment result page shows "pending"
- **THEN** the system SHALL poll `GET /api/v1/pagos/<payment_id>/status` every 5 seconds
- **THEN** if status changes to "approved", the UI SHALL update to the success screen
- **THEN** polling SHALL stop after 2 minutes and show "Tiempo de espera agotado" with instructions

### Requirement: Retry flow
The system SHALL allow the user to retry payment from the rejection/error screen without going back through the entire checkout flow.

#### Scenario: Retry resets payment flow
- **WHEN** the user clicks "Intentar de nuevo" on a rejected screen
- **THEN** `paymentStore.reset()` SHALL be called
- **THEN** the payment form SHALL be displayed again
- **THEN** the user SHALL NOT lose their cart items or order reference
