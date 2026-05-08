## 1. Backend - Model and Database

- [x] 1.1 Create Category SQLModel in backend/app/modules/category/models.py
- [x] 1.2 Add Category table migration (alembic or SQLModel.create_table)
- [x] 1.3 Add CategoryRepository in backend/app/modules/category/repositories.py
- [x] 1.4 Add CategoryService in backend/app/modules/category/services.py

## 2. Backend - API Endpoints

- [x] 2.1 Create category router in backend/app/modules/category/routers.py
- [x] 2.2 Implement POST /categories (create category)
- [x] 2.3 Implement GET /categories (list categories with optional parent filter)
- [x] 2.4 Implement GET /categories/tree (get full tree)
- [x] 2.5 Implement GET /categories/{id} (get single category)
- [x] 2.6 Implement PATCH /categories/{id} (update category)
- [x] 2.7 Implement DELETE /categories/{id} (delete with validation)
- [x] 2.8 Register router in backend/app/main.py

## 3. Backend - Validation Logic

- [x] 3.1 Implement circular reference validation for parent updates
- [x] 3.2 Implement duplicate name validation at same level
- [x] 3.3 Implement product association check on delete
- [x] 3.4 Implement subcategory presence check on delete
- [x] 3.5 Implement auto-position assignment for new categories

## 4. Frontend - State Management

- [x] 4.1 Create category store in frontend/src/stores/categoryStore.ts (Zustand)
- [x] 4.2 Add category API calls in frontend/src/api/categoryApi.ts
- [x] 4.3 Add TanStack Query hooks in frontend/src/hooks/useCategories.ts

## 5. Frontend - UI Components

- [x] 5.1 Create CategoryList component
- [x] 5.2 Create CategoryTreeView component
- [x] 5.3 Create CategoryForm component (create/edit)
- [x] 5.4 Create CategoryDeleteConfirm component
- [x] 5.5 Add routing for /categories in frontend/src/App.tsx

## 6. Integration and Testing

- [x] 6.1 Test CRUD operations via API client
- [x] 6.2 Test hierarchical queries (parent/children)
- [x] 6.3 Test circular reference prevention
- [x] 6.4 Test validation errors displayed in UI
- [x] 6.5 Run existing test suite to ensure no regressions