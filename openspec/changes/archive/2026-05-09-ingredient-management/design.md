## Context

The system needs to manage ingredients to eventually support product catalog management (where products have ingredients). Currently, we have an infrastructure setup but no domain model for ingredients.

## Goals / Non-Goals

**Goals:**
- Implement a robust data model for ingredients (name, description, unit of measure, cost).
- Provide API endpoints for standard CRUD operations.
- Ensure database consistency and proper repository/service layer implementation.

**Non-Goals:**
- Complex recipe management (linking ingredients to products with quantities) is out of scope for this phase.
- Inventory tracking for ingredients.

## Decisions

- **Domain Model**: Use SQLModel to define the `Ingredient` entity.
- **API Pattern**: Use FastAPI with standard RESTful routes, utilizing our existing UoW/Repository pattern established in `initial-scaffolding-and-setup`.
- **Validation**: Use Pydantic schemas for request validation.

## Risks / Trade-offs

- **Risk**: Over-engineering the ingredient model.
- **Mitigation**: Keep the initial model simple, focusing on core requirements (name, cost, unit) and allow extension later.
