## Why

El proyecto FoodStore necesita la capacidad de organizar los productos en categorías jerárquicas para mejorar la navegación del catálogo, facilitar la búsqueda y permitir filtros eficientes en el frontend. Actualmente no existe esta funcionalidad, lo que limita la usabilidad del sistema de catálogo.

## What Changes

- Crear modelo de datos para categorías con soporte a jerarquía (categoría padre/hijo)
- Implementar API REST para gestión CRUD de categorías
- Agregar validación de integridad referencial (productos no pueden eliminarse si tienen productos asociados)
- Crear endpoints para obtener el árbol de categorías completo
- Implementar ordenamiento personalizado de categorías

## Capabilities

### New Capabilities

- **category-management**: Gestión completa de categorías de productos incluyendo:
  - CRUD de categorías (crear, leer, actualizar, eliminar)
  - Soporte para categorías jerárquicas (categorías padre con subcategorías)
  - Reordenamiento de categorías via posición
  - Validación de integridad al eliminar (no permitir si hay productos asociados)

### Modified Capabilities

- *Ninguno* - Este change introduce una nueva funcionalidad independiente

## Impact

- **Backend**: Nuevo módulo `backend/app/modules/category/` con modelos, repositorio, servicio y router
- **Frontend**: Nuevo estado en Zustand y componentes para gestión de categorías
- **Base de datos**: Nueva tabla `categories` con relación jerárquica y posición ordinal
- **API**: Nuevos endpoints `/api/v1/categories/*`