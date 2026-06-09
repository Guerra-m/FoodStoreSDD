## ADDED Requirements

### Requirement: Featured products section with product cards
The featured products section SHALL display 3-4 top products from the catalog in a responsive grid layout. Each product card SHALL display product name, brief description, price, and an image/emoji. A "Ver más" button SHALL link to the full catalog.

#### Scenario: Featured products are fetched and displayed
- **WHEN** user scrolls to "Productos Destacados" section
- **THEN** system fetches products from `/api/v1/productos?limit=4` and displays them in a grid

#### Scenario: Product cards are interactive
- **WHEN** user hovers over a product card
- **THEN** card shows a subtle shadow/scale effect and "Ver más" button becomes more prominent

#### Scenario: Ver más button links to catalog
- **WHEN** user clicks "Ver más" button in featured products section
- **THEN** user is redirected to the full catalog page

#### Scenario: Featured products section handles API failure gracefully
- **WHEN** API call to fetch products fails
- **THEN** system displays static fallback products with placeholder emojis and shows no error message to user

### Requirement: Product card layout and styling
Each product card SHALL display product name, price, image (or emoji placeholder if image unavailable), and description in a clean, card-based layout using the established food/beverage color palette.

#### Scenario: Product card displays all required information
- **WHEN** user views a product card
- **THEN** card shows name, price, image, and description in an organized layout

### Requirement: Responsive grid layout for featured products
Featured products section SHALL display 1 column on mobile, 2 columns on tablet (md), and 4 columns on desktop (lg).

#### Scenario: Grid responds to screen size
- **WHEN** user resizes browser or views on different devices
- **THEN** grid layout adjusts to 1/2/4 columns appropriately
