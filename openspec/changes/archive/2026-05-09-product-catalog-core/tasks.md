## 1. Backend — Modelo y Base de Datos

- [x] 1.1 Crear modelo SQLModel `Product` en `backend/app/modules/productos/model.py` (name, description, price_in_cents, images: JSONB, stock, is_active)
- [x] 1.2 Crear tabla asociativa `producto_categorias` (product_id, category_id)
- [x] 1.3 Crear modelo `ProductoIngrediente` (product_id, ingredient_id, quantity)
- [x] 1.4 Generar migración de Alembic para las nuevas tablas
- [x] 1.5 Ejecutar migración y verificar estructura en BD

## 2. Backend — Repositorio y Servicio

- [x] 2.1 Implementar `ProductRepository` con operaciones CRUD + filtros de catálogo público
- [x] 2.2 Implementar `ProductService` con lógica de negocio: creación con asociaciones, actualización, validación de stock
- [x] 2.3 Agregar métodos de validación: verificar existencias de categorías/ingredientes antes de asociar

## 3. Backend — Schemas y Router

- [x] 3.1 Crear Pydantic schemas: `ProductCreate`, `ProductUpdate`, `ProductResponse`, `ProductPublicResponse`
- [x] 3.2 Crear router de admin: POST/PUT/DELETE /api/v1/products, GET /api/v1/products
- [x] 3.3 Crear router público: GET /api/v1/products/public/ (con filtros), GET /api/v1/products/public/{id}
- [x] 3.4 Endpoint de stock: PATCH /api/v1/products/{id}/stock
- [x] 3.5 Registrar routers en `backend/main.py`

## 4. Backend — Validación de Integridad en Módulos Existentes

- [x] 4.1 Agregar verificación de productos asociados en `CategoryService.delete()` (modificar módulo categorías)
- [x] 4.2 Agregar verificación de productos asociados en `IngredientService.delete()` (modificar módulo ingredientes)
- [x] 4.3 Agregar campo `product_count` en respuesta de lista de categorías

## 5. Frontend — APIs y Estado

- [x] 5.1 Crear `frontend/src/shared/api/productApi.ts` con llamadas a endpoints de productos
- [x] 5.2 Actualizar `frontend/src/shared/api/categoryApi.ts` para incluir product_count
- [x] 5.3 Crear hooks TanStack Query en `frontend/src/shared/hooks/useProducts.ts`
- [x] 5.4 Crear store Zustand `productStore.ts` para estado de UI del admin

## 6. Frontend — Admin ABM de Productos

- [x] 6.1 Crear página `Productos.tsx` con listado de productos (tabla con paginación)
- [x] 6.2 Crear formulario de producto con selector de categorías (multi-select) y selector de ingredientes con cantidad
- [x] 6.3 Crear modal de confirmación para eliminar producto
- [x] 6.4 Agregar control de stock inline (botones +/- y seteo manual)
- [x] 6.5 Agregar ruta /admin/products en el App.tsx del frontend

## 7. Frontend — Catálogo Público

- [x] 7.1 Crear página `Catalogo.tsx` con grilla de productos
- [x] 7.2 Implementar filtros: selector de categoría, búsqueda por nombre, rango de precio
- [x] 7.3 Crear página `ProductoDetalle.tsx` con info completa incluyendo ingredientes y alérgenos
- [x] 7.4 Agregar ruta /catalog y /catalog/{id} en el App.tsx del frontend

## 8. Verificación y Cierre

- [x] 8.1 Probar CRUD completo de productos vía API
- [x] 8.2 Probar filtros del catálogo público (categoría, precio, búsqueda)
- [x] 8.3 Probar validaciones de integridad (eliminar categoría/ingrediente con productos)
- [x] 8.4 Probar gestión de stock (set, increment, decrement, límite negativo)
- [x] 8.5 Verificar que los tests existentes sigan pasando sin regresiones
