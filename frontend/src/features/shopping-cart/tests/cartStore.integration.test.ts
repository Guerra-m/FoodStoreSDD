/**
 * Tests de integración para el flujo completo del carrito.
 * Ejecutar con: npx tsx src/features/shopping-cart/tests/cartStore.integration.test.ts
 * O desde la consola del navegador en desarrollo.
 */

import { useCartStore, selectCartTotal, selectCartItemsCount } from '../../../stores/cartStore';

console.log('=== CART STORE INTEGRATION TESTS ===\n');

// Reseteamos el store antes de empezar
useCartStore.getState().clearCart();

// ─── Flujo 1: Agregar productos simples ──────────────────────────────────────
console.log('Flujo 1: Agregar productos simples');

useCartStore.getState().addItem({
  productoId: 1,
  nombre: 'Hamburguesa Clásica',
  priceInCents: 2500,
  cantidad: 1,
});

const items1 = useCartStore.getState().items;
if (items1.length === 1 && items1[0].nombre === 'Hamburguesa Clásica') {
  console.log('✓ Producto agregado al carrito');
} else {
  console.log('✗ Falló al agregar producto');
}

// ─── Flujo 2: Incrementar cantidad de producto existente ─────────────────────
console.log('\nFlujo 2: Incrementar cantidad (mismo producto, misma config)');

useCartStore.getState().addItem({
  productoId: 1,
  nombre: 'Hamburguesa Clásica',
  priceInCents: 2500,
  cantidad: 2,
});

const items2 = useCartStore.getState().items;
if (items2.length === 1 && items2[0].cantidad === 3) {
  console.log('✓ Cantidad incrementada a 3 (1 + 2)');
} else {
  console.log(`✗ Falló incremento. Items: ${items2.length}, cantidad: ${items2[0]?.cantidad}`);
}

// ─── Flujo 3: Agregar producto con ingredientes excluidos ────────────────────
console.log('\nFlujo 3: Agregar producto con ingredientes excluidos');

useCartStore.getState().addItem({
  productoId: 1,
  nombre: 'Hamburguesa Clásica',
  priceInCents: 2500,
  cantidad: 1,
  excludedIngredientIds: [2, 5], // sin cebolla, sin pepino
});

const items3 = useCartStore.getState().items;
if (items3.length === 2) {
  console.log('✓ Mismo producto con exclusión = item separado');
} else {
  console.log(`✗ Deberían ser 2 items, hay ${items3.length}`);
}

// Verificar que el item personalizado tiene las exclusiones
const customItem = items3.find((i) => i.excludedIngredientIds.length > 0);
if (customItem && customItem.excludedIngredientIds.includes(2) && customItem.excludedIngredientIds.includes(5)) {
  console.log('✓ Ingredientes excluidos guardados correctamente');
} else {
  console.log('✗ Ingredientes excluidos no se guardaron');
}

// ─── Flujo 4: Selectores con items mixtos ────────────────────────────────────
console.log('\nFlujo 4: Selectores con items mixtos');

const items4 = useCartStore.getState().items;
const total = selectCartTotal(items4);
const count = selectCartItemsCount(items4);
// Item 1: 3 x 2500 = 7500, Item 2: 1 x 2500 = 2500 → total = 10000, count = 4
if (total === 10000 && count === 4) {
  console.log(`✓ Total: $${(total / 100).toFixed(2)}, unidades: ${count}`);
} else {
  console.log(`✗ Total esperado 10000, obtenido ${total}; count esperado 4, obtenido ${count}`);
}

// ─── Flujo 5: Modificar cantidad ─────────────────────────────────────────────
console.log('\nFlujo 5: Modificar cantidad');

const firstItem = useCartStore.getState().items[0];
useCartStore.getState().updateQuantity(firstItem.id, 5);

const updatedItem = useCartStore.getState().items.find((i) => i.id === firstItem.id);
if (updatedItem && updatedItem.cantidad === 5) {
  console.log('✓ Cantidad actualizada a 5');
} else {
  console.log(`✗ Cantidad esperada 5, obtenida ${updatedItem?.cantidad}`);
}

// ─── Flujo 6: Eliminar item ──────────────────────────────────────────────────
console.log('\nFlujo 6: Eliminar item');

const itemToRemove = useCartStore.getState().items[0];
useCartStore.getState().removeItem(itemToRemove.id);

const items6 = useCartStore.getState().items;
if (!items6.find((i) => i.id === itemToRemove.id)) {
  console.log('✓ Item eliminado correctamente');
} else {
  console.log('✗ Falló al eliminar item');
}

// ─── Flujo 7: Clear cart ─────────────────────────────────────────────────────
console.log('\nFlujo 7: Vaciar carrito');

useCartStore.getState().clearCart();
const items7 = useCartStore.getState().items;
if (items7.length === 0) {
  console.log('✓ Carrito vaciado correctamente');
} else {
  console.log(`✗ Deberían ser 0 items, hay ${items7.length}`);
}

console.log('\n=== INTEGRATION TESTS COMPLETED ===');
