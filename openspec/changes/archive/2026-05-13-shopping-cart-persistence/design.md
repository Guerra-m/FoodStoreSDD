## Context

Actualmente, el sistema permite visualizar productos y categorías, pero no existe una persistencia de la selección del usuario. La arquitectura frontend utiliza React con Zustand para el estado global y TanStack Query para el server-state. Para el carrito, necesitamos un estado puramente client-side que sobreviva a recargas de página y sea fácilmente accesible desde cualquier parte de la UI.

## Goals / Non-Goals

**Goals:**
- Implementar un store de Zustand persistente para el carrito.
- Permitir la personalización de productos (exclusión de ingredientes).
- Garantizar que el carrito se mantenga al recargar la página.
- Facilitar el cálculo automático de totales y subtotales en el cliente.

**Non-Goals:**
- Sincronización del carrito con el backend (se hará recién al momento de crear el pedido).
- Lógica de cupones de descuento (fuera de alcance para este change).
- Pagos o checkout (objetivo de cambios posteriores).

## Decisions

- **Zustand con Middleware de Persistencia**: Se utilizará `persist` middleware de Zustand para guardar el estado en `localStorage`. 
  - *Razón*: Es la forma estándar y más liviana de manejar estado persistente en el ecosistema Zustand.
- **Estructura del Cart Item**: Cada item en el carrito tendrá un ID único generado (posiblemente un hash del product ID + ingredientes excluidos) para permitir tener el mismo producto con diferentes personalizaciones como items separados.
- **Acciones Atómicas**: El store expondrá métodos como `addItem`, `removeItem`, `updateQuantity` y `clearCart`.
- **Derivación de Totales**: Se utilizarán Selectors o Getters dentro del store para calcular el total de items y el monto total, evitando redundancia de datos.

## Risks / Trade-offs

- **[Risk] Inconsistencia de Datos con Backend** → **Mitigation**: Al cargar el carrito o antes de ir al checkout, se deberán re-validar los precios y el stock contra la API (esto se tratará en `order-creation-atomic`). Por ahora, el carrito asume los precios cargados en el catálogo.
- **[Risk] Límite de LocalStorage** → **Mitigation**: El carrito suele ocupar muy pocos KB, por lo que el límite de 5MB de LocalStorage es más que suficiente.
- **[Trade-off] Client-side only** → Decidimos no persistir el carrito en base de datos para usuarios logueados por ahora para simplificar la implementación inicial y reducir latencia en operaciones frecuentes (como agregar/quitar).
