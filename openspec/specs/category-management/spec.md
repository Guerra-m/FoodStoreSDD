## ADDED Requirements

### Requirement: Category can be created with name and optional parent
The system SHALL allow creating a new category by providing a name and optionally linking to a parent category.

#### Scenario: Create root category
- **WHEN** admin sends POST /api/v1/categories with valid name and no parent_id
- **THEN** system creates a new root category and returns 201 with category data

#### Scenario: Create subcategory
- **WHEN** admin sends POST /api/v1/categories with valid name and parent_id pointing to existing category
- **THEN** system creates a new subcategory linked to the parent and returns 201

#### Scenario: Create category with invalid parent
- **WHEN** admin sends POST /api/v1/categories with parent_id that does not exist
- **THEN** system returns 404 error indicating parent category not found

#### Scenario: Create category with duplicate name at same level
- **WHEN** admin sends POST /api/v1/categories with name that already exists under the same parent
- **THEN** system returns 409 conflict error indicating duplicate name

### Requirement: Category list can be retrieved
The system SHALL return a list of categories, optionally filtered by parent to get only direct children.

#### Scenario: Get all root categories
- **WHEN** admin sends GET /api/v1/categories without parent_id filter
- **THEN** system returns all root categories (those with parent_id = null)

#### Scenario: Get subcategories of a specific category
- **WHEN** admin sends GET /api/v1/categories?parent_id={id}
- **THEN** system returns only direct children of that category

#### Scenario: Get full category tree
- **WHEN** admin sends GET /api/v1/categories/tree
- **THEN** system returns complete tree with nested children in hierarchical structure

### Requirement: Category can be updated
The system SHALL allow updating category name and/or parent. Position can also be updated for reordering.

#### Scenario: Update category name
- **WHEN** admin sends PATCH /api/v1/categories/{id} with new name
- **THEN** system updates the category name and returns 200 with updated data

#### Scenario: Move category to different parent
- **WHEN** admin sends PATCH /api/v1/categories/{id} with different parent_id
- **THEN** system moves the category to the new parent and returns updated data

#### Scenario: Move category to create circular reference
- **WHEN** admin tries to set a category as parent of one of its own descendants
- **THEN** system returns 400 error indicating circular reference not allowed

#### Scenario: Update category position
- **WHEN** admin sends PATCH /api/v1/categories/{id} with new position value
- **THEN** system updates the position and reorders siblings accordingly

### Requirement: Category can be deleted
The system SHALL allow deleting a category, with validation to prevent deletion if products are associated.

#### Scenario: Delete category without products
- **WHEN** admin sends DELETE /api/v1/categories/{id} for a category with no associated products
- **THEN** system deletes the category and returns 204

#### Scenario: Delete category with products
- **WHEN** admin sends DELETE /api/v1/categories/{id} for a category that has products
- **THEN** system returns 409 conflict error indicating category has associated products

#### Scenario: Delete category with subcategories
- **WHEN** admin sends DELETE /api/v1/categories/{id} for a category that has child categories
- **THEN** system returns 400 error indicating category has subcategories

### Requirement: Category supports custom ordering
The system SHALL allow categories to be ordered via a position field that respects sibling ordering.

#### Scenario: Reorder categories within same parent
- **WHEN** admin updates position of multiple categories within same parent
- **THEN** categories are returned in ascending position order

#### Scenario: Category position defaults to end of list
- **WHEN** a new category is created without specifying position
- **THEN** system assigns position as (max position + 1) of siblings