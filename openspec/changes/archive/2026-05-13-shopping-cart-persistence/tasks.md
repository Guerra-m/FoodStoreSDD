## 1. Tipos y Estructuras

- [x] 1.1 Definir tipos TypeScript para el carrito (`CartItem`, `CartState`, `CartActions`, `AddToCartParams`) en `frontend/src/features/shopping-cart/types.ts`
- [x] 1.2 Definir constantes y configuración del store (clave de localStorage, versión de persistencia, límites)

## 2. Store de Zustand (Core)

- [x] 2.1 Implementar `cartStore` con Zustand + middleware `persist` (localStorage), incluyendo estado inicial y tipado completo
- [x] 2.2 Implementar acción `addItem` con soporte de personalización (exclusión de ingredientes) y detección de duplicados por misma configuración
- [x] 2.3 Implementar acciones `removeItem`, `updateQuantity` y `clearCart`
- [x] 2.4 Implementar selectores derivados: `selectCartTotal`, `selectCartItemsCount`, `selectItemSubtotal` para cálculo automático de montos

## 3. Componentes de UI del Carrito

- [x] 3.1 Crear componente `CartDrawer` o `CartDropdown` que muestre la lista de items del carrito con sus cantidades y personalizaciones
- [x] 3.2 Crear componente `CartItemCard` con controles de cantidad (+/-), indicador de ingredientes excluidos y botón de eliminar
- [x] 3.3 Crear componente `CartSummary` con subtotal por item y total general del carrito
- [x] 3.4 Crear componente `AddToCartButton` con modal/drawer de selección de ingredientes a excluir antes de agregar

## 4. Integración y Navegación

- [x] 4.1 Integrar `AddToCartButton` en las vistas de catálogo (ProductCard, ProductDetail)
- [x] 4.2 Agregar indicador visual de cantidad de items en el header/navbar (badge con `selectCartItemsCount`)
- [x] 4.3 Implementar sincronización entre pestañas usando el evento `storage` de window (opcional)

## 5. Testing

- [x] 5.1 Escribir tests unitarios del store (addItem, removeItem, updateQuantity, clearCart, persistencia)
- [x] 5.2 Escribir tests de selectores derivados (subtotales, total, conteo de items)
- [x] 5.3 Escribir tests de integración para el flujo completo: agregar producto con ingredientes excluidos → verificar en carrito → modificar cantidad → eliminar
