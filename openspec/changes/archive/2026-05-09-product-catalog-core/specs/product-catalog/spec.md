## ADDED Requirements

### Requirement: Product CRUD
The system SHALL allow administrators to create, read, update, and delete products.

#### Scenario: Successfully create a product
- **WHEN** an admin submits valid product data (name, description, price_in_cents, category_ids, ingredient_ids with quantities, images, stock)
- **THEN** the system creates the product with associations and returns 201 with the product data

#### Scenario: Fail to create a product without required fields
- **WHEN** an admin submits product data without a name or price
- **THEN** the system returns a 422 Unprocessable Entity error

#### Scenario: Successfully list products (admin)
- **WHEN** an admin requests a paginated list of products
- **THEN** the system returns all products including inactive ones, with associated categories and ingredients

#### Scenario: Successfully update a product
- **WHEN** an admin updates an existing product's price and categories
- **THEN** the system updates the product and its associations, returning 200 with updated data

#### Scenario: Successfully delete a product
- **WHEN** an admin deletes an existing product with no active orders
- **THEN** the system removes the product and its associations, returning 204

### Requirement: Product-category association
The system SHALL allow associating a product with one or more categories (many-to-many).

#### Scenario: Associate product with multiple categories
- **WHEN** an admin creates/updates a product with multiple category_ids
- **THEN** the system creates the corresponding entries in the association table

#### Scenario: Remove product from a category
- **WHEN** an admin updates a product removing a category_id from the list
- **THEN** the system deletes the corresponding association entry

#### Scenario: Get products by category
- **WHEN** a user filters the public catalog by category_id
- **THEN** the system returns only products associated with that category

### Requirement: Product-ingredient association with quantity
The system SHALL allow associating a product with ingredients, each with a specific quantity.

#### Scenario: Associate ingredient with quantity
- **WHEN** an admin creates/updates a product with ingredient_id and quantity
- **THEN** the system stores the ingredient-quantity pair for that product

#### Scenario: Display ingredients in product detail
- **WHEN** a user views a product detail
- **THEN** the system shows each ingredient name, quantity, unit, and allergen information

### Requirement: Manual stock management
The system SHALL allow administrators to manually set, increment, or decrement product stock.

#### Scenario: Set stock to specific value
- **WHEN** an admin sets stock to 50 for a product
- **THEN** the system updates the product stock to exactly 50

#### Scenario: Decrement stock
- **WHEN** an admin decrements stock by 5 for a product with 20 stock
- **THEN** the system updates the product stock to 15

#### Scenario: Fail to decrement below zero
- **WHEN** an admin tries to decrement stock below 0
- **THEN** the system returns a 400 error indicating insufficient stock

### Requirement: Public product catalog with filters
The system SHALL provide a public catalog endpoint that lists active products with filtering capabilities.

#### Scenario: List all active products
- **WHEN** a user requests GET /api/v1/products/public/
- **THEN** the system returns a paginated list of active products ordered alphabetically

#### Scenario: Filter products by category
- **WHEN** a user requests products with category_id=X
- **THEN** the system returns only active products in that category

#### Scenario: Filter products by price range
- **WHEN** a user requests products with min_price=1000 and max_price=5000
- **THEN** the system returns only active products whose price_in_cents is between 1000 and 5000

#### Scenario: Search products by name
- **WHEN** a user searches with query "pizza"
- **THEN** the system returns active products whose name contains "pizza" (case-insensitive)

#### Scenario: Combined filters
- **WHEN** a user searches with category_id=X, min_price=1000, and search="pizza"
- **THEN** the system applies all filters together (AND logic)

### Requirement: Product visibility toggle
The system SHALL allow administrators to activate or deactivate products. Inactive products are hidden from the public catalog.

#### Scenario: Deactivate a product
- **WHEN** an admin sets a product as inactive
- **THEN** the product is no longer shown in the public catalog

#### Scenario: Inactive product not in public catalog
- **WHEN** a user browses the public catalog
- **THEN** inactive products are excluded from results

### Requirement: Product detail with allergens
The system SHALL display allergen information in the product detail, derived from associated ingredients.

#### Scenario: View product with allergens
- **WHEN** a user views a product detail page
- **THEN** the system shows allergen labels (e.g., "Contains: gluten, dairy") based on ingredients
