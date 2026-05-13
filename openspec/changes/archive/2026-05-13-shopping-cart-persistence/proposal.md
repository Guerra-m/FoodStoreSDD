## Why

El carrito de compras es un componente esencial para la experiencia de usuario en un e-commerce. Actualmente no contamos con una forma de que los usuarios agrupen productos antes de realizar un pedido. Este cambio implementa la lógica del carrito en el frontend con persistencia local y la capacidad de personalizar productos (excluyendo ingredientes), sentando las bases para el proceso de checkout.

## What Changes

- Implementación de un store de Zustand para la gestión del estado del carrito.
- Persistencia del carrito en `localStorage` para que no se pierda al recargar la página.
- Funcionalidad para agregar, remover y actualizar cantidades de productos.
- Lógica de personalización: permitir excluir ingredientes específicos de un producto al agregarlo al carrito.
- Sincronización del estado del carrito entre pestañas del navegador (opcional pero recomendado).

## Capabilities

### New Capabilities
- `shopping-cart`: Lógica de gestión de productos seleccionados, cálculo de totales y personalización (exclusión de ingredientes).

### Modified Capabilities
- `client-state-management`: Extender los patrones de gestión de estado global para incluir la persistencia local del carrito.

## Impact

- **Frontend**: Nuevo feature/feature-folder para el carrito. Actualización de los componentes de catálogo para interactuar con el store del carrito.
- **Zustand**: Integración del middleware de persistencia.
- **UX**: Mejora significativa en el flujo de compra.
