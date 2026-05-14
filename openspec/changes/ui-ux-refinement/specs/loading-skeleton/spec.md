## ADDED Requirements

### Requirement: SkeletonCard component
The system SHALL provide a `SkeletonCard` component that displays an animated placeholder for product cards in grids and lists. The component SHALL use Tailwind `animate-pulse` with `bg-gray-200` shapes mimicking card layout (image area, title line, description lines, price area).

#### Scenario: SkeletonCard renders in catalog grid
- **WHEN** the catalog page is loading products
- **THEN** the system SHALL display a grid of `SkeletonCard` components (6 by default) instead of "Cargando..." text
- **THEN** each skeleton SHALL have `aria-busy="true"` and `aria-label="Cargando productos"`

#### Scenario: SkeletonCard has correct shape
- **WHEN** `SkeletonCard` is rendered
- **THEN** it SHALL display a rectangular area for the product image (16:9 aspect ratio)
- **THEN** it SHALL display a line for the product title (60% width)
- **THEN** it SHALL display two shorter lines for the description (80%, 40% width)
- **THEN** it SHALL display a line for the price (30% width)

### Requirement: SkeletonTable component
The system SHALL provide a `SkeletonTable` component for tabular data loading states (order lists, user lists, admin tables). It SHALL render animated placeholder rows matching typical table column widths.

#### Scenario: SkeletonTable renders in admin orders
- **WHEN** the admin orders page is loading
- **THEN** the system SHALL display a `SkeletonTable` with 5 rows instead of "Cargando pedidos..." text

#### Scenario: SkeletonTable renders with custom rows
- **WHEN** a page specifies `rows={8}` on `SkeletonTable`
- **THEN** the component SHALL render exactly 8 placeholder rows

### Requirement: SkeletonDetail component
The system SHALL provide a `SkeletonDetail` component for detail/single-item loading states (product detail page, order detail modal, user detail). It SHALL render a layout with a large image area on top, followed by multiple text lines of varying widths.

#### Scenario: SkeletonDetail renders in product detail
- **WHEN** the product detail page is loading product data
- **THEN** the system SHALL display a `SkeletonDetail` component instead of "Cargando..." text

### Requirement: Minimum loading time to prevent flicker
The system SHALL enforce a minimum display time of 300ms for skeleton components to prevent visual flicker when data loads very quickly.

#### Scenario: Fast data load with skeleton
- **WHEN** data loads in under 300ms
- **THEN** the skeleton SHALL remain visible for at least 300ms before transitioning to content
- **THEN** the transition SHALL use a subtle fade (Tailwind `transition-opacity duration-200`)

### Requirement: Skeleton wrapper component
The system SHALL provide a generic `Skeleton` primitive component with configurable shape (`rect`, `circle`, `text`), width, height, and optional `className` for composability.

#### Scenario: Skeleton primitive renders custom shapes
- **WHEN** `Skeleton shape="circle" size={40}` is rendered
- **THEN** it SHALL display a circular animated placeholder of 40×40 pixels

#### Scenario: Skeleton primitive renders with custom className
- **WHEN** `Skeleton shape="rect" className="w-full h-32"` is rendered
- **THEN** the element SHALL include the provided className alongside base skeleton styles
