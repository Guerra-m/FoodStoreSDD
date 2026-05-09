## Why

El catálogo de productos es el corazón del negocio de FoodStore. Actualmente el sistema tiene categorías e ingredientes, pero no existe la entidad "producto" que los unifique. Sin productos no hay carrito, no hay pedidos, no hay facturación. Este change habilita toda la cadena de valor del sistema: desde que el admin carga un producto hasta que el cliente lo ve, lo agrega al carrito y lo compra.

## What Changes

- Creación del modelo `Product` con campos: nombre, descripción, precio, imágenes, stock, visibilidad
- Asociación producto ↔ categorías (relación many-to-many: un producto puede estar en varias categorías)
- Asociación producto ↔ ingredientes con cantidad (cada producto especifica qué ingredientes lleva y en qué cantidad)
- Gestión manual de stock (el admin puede actualizar stock desde el panel)
- Catálogo público con filtros por categoría, ingredientes, rango de precio y búsqueda por nombre
- Protección de integridad: no se puede eliminar una categoría/ingrediente si hay productos asociados
- Frontend admin: ABM de productos con selector de categorías e ingredientes
- Frontend público: vista de catálogo con filtros y detalle de producto

## Capabilities

### New Capabilities
- `product-catalog`: Gestión completa del catálogo de productos — CRUD administrativo, asociación con categorías e ingredientes, control de stock manual, y catálogo público con filtros (por categoría, ingredientes, precio, búsqueda). Incluye el detalle de producto con información nutricional y de alérgenos derivada de los ingredientes.

### Modified Capabilities
- `category-management`: Agregar validación para impedir eliminación de categorías que tengan productos asociados. Exponer conteo de productos por categoría en la lista.
- `ingredient-management`: Agregar validación para impedir eliminación de ingredientes que estén siendo usados por productos.

## Impact

- **Backend**: Nuevo módulo `productos/` siguiendo el patrón establecido (model.py, repository.py, service.py, schema.py, router.py). Nueva tabla `products`, tabla asociativa `productos_categorias`, y tabla `producto_ingredientes` con cantidad. Registro del router en main.py.
- **Frontend**: Nuevas páginas de admin para ABM de productos. Nueva vista de catálogo público. Nuevo store Zustand para productos. Nuevas APIs y hooks de TanStack Query. Actualización de las vistas de categorías e ingredientes para mostrar conteo de productos.
- **Base de datos**: Migración de Alembic para crear las nuevas tablas. Seed data opcional con productos de ejemplo.
- **API**: Endpoints REST bajo `/api/v1/products/` operaciones CRUD + `/api/v1/products/public/` para catálogo público con filtros.
