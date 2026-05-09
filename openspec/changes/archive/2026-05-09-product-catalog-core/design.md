## Context

El proyecto FoodStore avanza sobre una arquitectura consolidada con:
- **Backend**: FastAPI + SQLModel + PostgreSQL, con patrón Repository/UoW
- **Frontend**: React + TypeScript + Vite, con Zustand para estado global y TanStack Query para fetching
- **Autenticación**: JWT con refresh token rotation + RBAC (roles: Admin, Cliente, Delivery)
- **Módulos existentes**: usuarios, categorías (jerárquicas), ingredientes

El change 5 (`product-catalog-core`) es el más importante del roadmap porque introduce la entidad central del negocio. Todo lo que sigue (carrito, pedidos, pagos) depende de que existan productos.

Las user stories cubiertas son US-015 a US-023: CRUD de productos, asociación con categorías e ingredientes, gestión de stock, y catálogo público con filtros.

## Goals / Non-Goals

**Goals:**

- Crear el modelo `Product` con nombre, descripción, precio, imágenes (URLs), stock, visibilidad (activo/inactivo)
- Asociar productos a categorías (many-to-many: un producto en varias categorías)
- Asociar productos a ingredientes con cantidad (many-to-many: qué ingredientes lleva y cuánto)
- Implementar CRUD administrativo de productos (solo Admin)
- Implementar gestión manual de stock (Admin puede incrementar/decrementar/setear stock)
- Implementar catálogo público con filtros: por categoría, rango de precio, búsqueda por nombre
- Implementar detalle de producto público con ingredientes (incluyendo info de alérgenos)
- Validar integridad referencial: no permitir eliminar categorías/ingredientes con productos asociados
- Frontend admin: ABM de productos con selector de categorías e ingredientes
- Frontend público: grilla de productos con filtros y página de detalle

**Non-Goals:**

- No incluye variantes de producto (talle, color, etc.) — futuro change
- No incluye imágenes reales (solo URLs) — futuro change de multimedia
- No incluye precios por volumen ni descuentos — futuro change de pricing
- No incluye reviews ni valoraciones — fuera de alcance del roadmap actual
- No incluye importación/exportación masiva — posible future improvement

## Decisions

### 1. Estructura de tablas: producto con tablas asociativas

**Decisión:** Tabla `products` + `producto_categorias` (N:N) + `producto_ingredientes` (N:N con cantidad).

**Alternativas consideradas:**
- JSONB arrays de IDs: No tiene integridad referencial, complejo de queryar
- Categoría única por producto (FK directa): No permite que un producto esté en multiples categorías

**Rationale:** La relación N:N refleja la realidad del negocio (una pizza puede estar en "Pizzas" y también en "Ofertas"). Las tablas asociativas mantienen integridad referencial y permiten queries eficientes con JOINs.

### 2. Stock como campo en el producto

**Decisión:** `stock` como campo entero en la tabla `products`, actualizado manualmente por el Admin.

**Alternativas:**
- Tabla separada de movimientos de stock: Más trazable pero overkill para la gestión manual inicial
- Trigger de actualización automática por pedidos: Se agregará en change 9 (order-fsm) cuando haya confirmación de pedidos

**Rationale:** Por ahora el stock se maneja manualmente. Cuando existan pedidos confirmados, el change 9 sumará la actualización automática. Es más simple comenzar así y evolucionar.

### 3. Precio como entero (céntimos)

**Decisión:** Almacenar precio en céntimos (integer) para evitar problemas de redondeo con floats.

**Alternativas:**
- DECIMAL(10,2): Válido pero inconsistente con el resto del modelo
- Float: Riesgo de errores de redondeo en cálculos

**Rationale:** Usar enteros evita problemas de precisión en sumas, descuentos futuros y comparaciones. El frontend convierte a decimal para display.

### 4. Imágenes como array de strings (URLs)

**Decisión:** Campo `images: list[str]` en el modelo, almacenado como JSONB en PostgreSQL.

**Alternativas:**
- Tabla separada de imágenes: Overkill para este stage
- Single image URL: No permite múltiples vistas del producto

**Rationale:** Simple, escalable, y las URLs permiten apuntar a un CDN en el futuro sin migración de datos.

### 5. Catálogo público con filtros vía query params

**Decisión:** Endpoint `GET /api/v1/products/public/` con query params: `category_id`, `search`, `min_price`, `max_price`, `page`, `per_page`.

**Rationale:** Sigue el patrón REST existente y es fácil de cachear (CDN, Redis) en el futuro. Los filtros se aplican a nivel de query SQL para eficiencia.

### 6. Validación de integridad al eliminar categorías/ingredientes

**Decisión:** Verificar existencia de productos asociados ANTES de permitir la eliminación, tanto a nivel de backend (servicio) como de UI (deshabilitar botón + mostrar advertencia).

**Rationale:** Consistente con la validación existente en categorías (productos propios). Se extiende a ingredientes.

## Risks / Trade-offs

- **[Riesgo]** Catálogo público sin paginación podría ser lento con muchos productos → **Mitigación**: Paginación obligatoria (default 20 items), offset-based
- **[Riesgo]** Eliminación de categoría/ingrediente falla silenciosamente si hay productos → **Mitigación**: Validación explícita en servicio con mensaje claro
- **[Trade-off]** Stock manual vs automático → Priorizamos simplicidad ahora; la actualización automática llegará con order-fsm (change 9)
- **[Riesgo]** Muchas categorías por producto podrían complejizar la UI → **Mitigación**: Selector multi-choice con búsqueda en el frontend

## Migration Plan

1. Crear migración de Alembic para tablas nuevas (`products`, `producto_categorias`, `producto_ingredientes`)
2. Crear módulo backend `productos/` con model, repository, service, schema, router
3. Agregar validaciones de integridad en módulos `categorias/` e `ingredientes/`
4. Registrar router en `main.py`
5. Crear store, API client y hooks en frontend
6. Crear páginas admin de ABM de productos
7. Crear página pública de catálogo con filtros
8. Actualizar páginas existentes de categorías e ingredientes para mostrar conteo de productos asociados
9. Seed data opcional con productos de ejemplo

Rollback: Revertir migración + eliminar endpoints y componentes.

## Open Questions

- ¿Se necesita ordenamiento en el catálogo público? (feature, posventa manual, aleatorio?) → Asumimos orden alfabético por ahora
- ¿Límite máximo de imágenes por producto? → Sin límite explícito, manejamos con sentido común en UI
- ¿Los ingredientes con alérgenos deben marcarse visualmente en el catálogo? → Sí, se muestra en detalle de producto
