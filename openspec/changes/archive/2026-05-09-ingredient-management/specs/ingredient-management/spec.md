## ADDED Requirements

### Requirement: Ingredient management
The system SHALL allow authorized users to create, read, update, and delete ingredients.

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

#### Scenario: Successfully delete an ingredient
- **WHEN** user deletes an existing ingredient
- **THEN** system removes the ingredient from the catalog
