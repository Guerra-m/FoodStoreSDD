## ADDED Requirements

### Requirement: Order confirmation page
The system SHALL provide a dedicated `/order-confirmation/:orderId` route that displays a visual confirmation after a successful order creation.

#### Scenario: Route exists and is accessible
- **WHEN** the user navigates to `/order-confirmation/123`
- **THEN** the system SHALL render the `OrderConfirmationPage` component
- **THEN** the page SHALL display a success header with a checkmark icon and "¡Pedido confirmado!" title

#### Scenario: Page shows order summary
- **WHEN** the order confirmation page loads with a valid `orderId`
- **THEN** the page SHALL display:
  - Número de pedido (formateado como "#123")
  - Fecha y hora del pedido
  - Lista de items con nombre, cantidad, precio unitario y subtotal
  - Total del pedido destacado
  - Dirección de entrega (calle, número, ciudad, código postal)
  - Estado actual del pedido y estado del pago con badges de colores

#### Scenario: Page shows loading state
- **WHEN** the order details are loading
- **THEN** the page SHALL display skeleton loading placeholders instead of "Cargando..." text
- **THEN** skeletons SHALL match the layout structure (header area, items list area, summary area)

#### Scenario: Page shows error state
- **WHEN** the order ID is invalid or the API call fails
- **THEN** the page SHALL display an error message with a "Volver al catálogo" button

### Requirement: Post-creation redirect to confirmation
After a successful order creation, the system SHALL redirect the user to the order confirmation page.

#### Scenario: Redirect after order creation
- **WHEN** the order creation API returns success
- **THEN** the system SHALL navigate to `/order-confirmation/<newOrderId>`
- **THEN** a success toast SHALL appear (per notifications spec)
- **THEN** the shopping cart SHALL be cleared

### Requirement: OrderSummaryCard reusable component
The system SHALL provide a reusable `OrderSummaryCard` component that displays a compact order summary for use in both the confirmation page and order detail modals.

#### Scenario: OrderSummaryCard shows key info
- **WHEN** `OrderSummaryCard` receives an order object with items, total, and address
- **THEN** it SHALL render the order items list with quantities and prices
- **THEN** it SHALL render the total amount
- **THEN** it SHALL render the delivery address
- **THEN** it SHALL render the order status and payment status badges

### Requirement: Action buttons on confirmation page
The confirmation page SHALL provide clear action buttons for the user to continue.

#### Scenario: Action buttons render
- **WHEN** the order confirmation page is displayed
- **THEN** a "Ver mis pedidos" button SHALL link to `/mis-pedidos`
- **THEN** a "Seguir comprando" button SHALL link to `/catalog`
