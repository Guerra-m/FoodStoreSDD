## Context

El proyecto FoodStore tiene una arquitectura existente con:
- Backend: FastAPI con patrón Repository y Unit of Work
- Frontend: React con Zustand y TanStack Query
- Base de datos: PostgreSQL con SQLModel

El Change 2 (auth-and-rbac-system) estableció el sistema de autenticación. Ahora necesitamos agregar la gestión de categorías para organizar el catálogo de productos.

## Goals / Non-Goals

**Goals:**
- Crear modelo de datos para categorías con soporte a jerarquía (árbol)
- Implementar API REST completa con operaciones CRUD
- Mantener consistencia con la arquitectura existente (Repository/UoW)
- Soportar reordenamiento de categorías vía campo de posición

**Non-Goals:**
- No incluye gestión de atributos de categorías (specs extendidos)
- No incluye migración de datos existentes (no hay categorías aún)
- No incluye sistema de caché para categorías (futuro change)

## Decisions

### 1. Estructura jerárquica de categorías

**Decisión:** Usar campo `parent_id` con self-reference en lugar deadjacency list o nested sets.

**Alternativas consideradas:**
- Adjacency list (parent_id): Simple, fácil de queryar pero limitado para深的 árboles
- Nested Sets: Complejo de mantener, mejores queries de rango
- Materialized Path: Más complejo de implementar

**Rationale:** El adjacency list es suficiente para las necesidades expected del proyecto (3-4 niveles máximo) y mantiene consistencia con el patrón Repository existente.

### 2. Validación de integridad al eliminar

**Decisión:** Validación a nivel de servicio - no permitir eliminación de categorías que tienen productos asociados.

**Alternativas:**
- Eliminación en cascada: No deseado, perdería datos
- Soft delete: Más complejo, necesita filtro global en queries

**Rationale:** Mantiene datos integrity y es el comportamiento esperado por el usuario.

### 3. Patrón de endpoints REST

**Decisión:** Endpoints anidados para operaciones de subcategorías (`/categories/{id}/subcategories`)

**Rationale:** Sigue las convenciones REST establecidas y permite operaciones claras en el árbol.

## Risks / Trade-offs

- [Riesgo] Queries recursivas para árbol completo → **Mitigación**: Implementar endpoint específico `/tree` que usa CTE recursivo si el árbol crece mucho
- [Trade-off] Simplicity vs Performance → Por ahora el diseño prioriza simplicidad; caching puede agregarse en change futuro

## Migration Plan

1. Crear nueva tabla `categories` en la base de datos
2. Deploy cambios de backend (migración automática)
3. Crear componentes frontend de categorías
4. Agregar al menú de admin

No hay migración de datos ni rollback necesario (no hay datos existentes).

## Open Questions

- ¿Cuántos niveles de profundidad necesita el árbol de categorías? (actualmente sin límite, asume ~3-4)
- ¿Se necesita soporte para imágenes en categorías? (no incluido, futuro change)