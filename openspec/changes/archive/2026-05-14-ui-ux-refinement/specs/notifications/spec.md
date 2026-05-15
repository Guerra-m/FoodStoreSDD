## ADDED Requirements

### Requirement: Global toast container
The system SHALL render a `ToastContainer` from `react-toastify` at the root level of the application (in `App.tsx`) to provide global notification capability. The container SHALL be configured with `position="bottom-right"`, `autoClose={3000}`, and `theme="light"`.

#### Scenario: ToastContainer renders in App shell
- **WHEN** the application loads
- **THEN** a `ToastContainer` SHALL be rendered inside the root component hierarchy
- **THEN** it SHALL NOT be visible until a toast is triggered

### Requirement: useToast hook
The system SHALL provide a `useToast` custom hook that wraps `react-toastify` functions (success, error, warning, info) for consistent usage across the application.

#### Scenario: useToast.success shows success toast
- **WHEN** `toast.success('Producto agregado al carrito')` is called
- **THEN** a green success toast SHALL appear with the message "Producto agregado al carrito"
- **THEN** the toast SHALL auto-dismiss after 3 seconds

#### Scenario: useToast.error shows error toast
- **WHEN** `toast.error('Error al crear el pedido')` is called
- **THEN** a red error toast SHALL appear with the message "Error al crear el pedido"

#### Scenario: useToast.warning shows warning toast
- **WHEN** `toast.warning('Stock limitado')` is called
- **THEN** a yellow warning toast SHALL appear with the message "Stock limitado"

#### Scenario: useToast.info shows info toast
- **WHEN** `toast.info('Pedido en preparación')` is called
- **THEN** a blue info toast SHALL appear with the message "Pedido en preparación"

### Requirement: Toast on add to cart
The system SHALL display a success toast when a product is added to the shopping cart.

#### Scenario: Toast fires on add to cart
- **WHEN** the user clicks "Agregar" on a product in the catalog
- **THEN** a success toast SHALL appear with the message `"<producto.nombre> agregado al carrito"`

### Requirement: Toast on order creation
The system SHALL display a success toast when an order is created successfully.

#### Scenario: Toast fires on order created
- **WHEN** an order is created successfully
- **THEN** a success toast SHALL appear with the message "Pedido #<id> creado con éxito"

### Requirement: Toast on API errors
The system SHALL display error toasts when API calls fail in user-facing operations.

#### Scenario: Toast on failed product load
- **WHEN** the catalog API call fails
- **THEN** an error toast SHALL appear with "Error al cargar el catálogo. Intentá de nuevo."
- **THEN** the page SHALL still show the error state inline (existing behavior preserved)

#### Scenario: Toast on failed order creation
- **WHEN** the order creation API call fails
- **THEN** an error toast SHALL appear with "No se pudo crear el pedido. Intentá de nuevo."
