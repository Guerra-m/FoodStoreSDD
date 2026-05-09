## MODIFIED Requirements

### Requirement: Category can be deleted
The system SHALL allow deleting a category, with validation to prevent deletion if products are associated.

#### Scenario: Delete category without products
- **WHEN** admin sends DELETE /api/v1/categories/{id} for a category with no associated products
- **THEN** system deletes the category and returns 204

#### Scenario: Delete category with products
- **WHEN** admin sends DELETE /api/v1/categories/{id} for a category that has associated products (via producto_categorias)
- **THEN** system returns 409 conflict error indicating category has associated products

#### Scenario: Delete category with subcategories
- **WHEN** admin sends DELETE /api/v1/categories/{id} for a category that has child categories
- **THEN** system returns 400 error indicating category has subcategories

## ADDED Requirements

### Requirement: Product count per category
The system SHALL expose the count of products associated with each category in list responses.

#### Scenario: Category list includes product count
- **WHEN** admin requests GET /api/v1/categories
- **THEN** each category in the response includes a `product_count` field with the number of associated active products
