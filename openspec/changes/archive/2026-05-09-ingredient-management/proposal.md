## Why

Currently, the system lacks functionality to manage ingredients, which are essential for defining product components and calculating stock or costs. This feature is necessary to move towards comprehensive product catalog management.

## What Changes

- Add a new capability for ingredient management.
- Implement API endpoints to CRUD ingredients.
- Define data models for Ingredients.
- Integrate Ingredient management with the existing product catalog (future-proof).

## Capabilities

### New Capabilities
- `ingredient-management`: Define, list, update, and delete individual ingredients used in products.

### Modified Capabilities
- `infra-core`: Minor update to include ingredient-related repositories or base models if needed.

## Impact

- Database schema update (new `ingredients` table).
- New API routes under `/api/v1/ingredients`.
- Potential updates to product-related services to support ingredient composition.
