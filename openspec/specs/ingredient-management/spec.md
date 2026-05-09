## ADDED Requirements

### Requirement: Ingredient management
The system SHALL allow authorized users to create, read, update, and delete ingredients, with validation to prevent deletion if products are associated.

#### Scenario: Successfully create an ingredient
- **WHEN** user submits valid ingredient data (name, description, unit, cost)
- **THEN** system creates the ingredient and returns the new ingredient ID

#### Scenario: Fail to create an ingredient with missing required fields
- **WHEN** user submits ingredient data without a name
- **THEN** system returns a 422 Unprocessable Entity error

#### Scenario: Successfully list ingredients
- **WHEN** user requests a list of ingredients
- **THEN** system returns a paginated list of all registered ingredients

#### Scenario: Successfully update an ingredient
- **WHEN** user updates an existing ingredient's cost
- **THEN** system updates the ingredient details

#### Scenario: Fail to delete ingredient with associated products
- **WHEN** user tries to delete an ingredient that is used by one or more products (via producto_ingredientes)
- **THEN** system returns a 409 conflict error indicating the ingredient has associated products

#### Scenario: Successfully delete an ingredient without associations
- **WHEN** user deletes an existing ingredient with no associated products
- **THEN** system removes the ingredient from the catalog
