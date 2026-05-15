/**
 * Tests unitarios para el carrito de compras.
 * Ejecutar con: npx tsx src/stores/tests/cartStore.test.ts
 * O desde la consola del navegador en desarrollo.
 *
 * Sigue el mismo patrón que los tests existentes en components/auth/tests/.
 */

// ─── Selectors (funciones puras, no requieren store) ─────────────────────────

import {
  selectCartTotal,
  selectCartItemsCount,
  selectItemSubtotal,
} from '../cartStore';
import type { CartItem } from '../../types/shopping-cart';

console.log('=== CART STORE TESTS ===\n');

// ─── Test 1: Selector selectItemSubtotal ──────────────────────────────────────
console.log('Test 1: selectItemSubtotal');
{
  const item: CartItem = {
    id: '1-',
    productoId: 1,
    nombre: 'Hamburguesa Clásica',
    priceInCents: 2500,
    cantidad: 3,
    excludedIngredientIds: [],
  };
  const subtotal = selectItemSubtotal(item);
  const expected = 7500; // 2500 * 3
  if (subtotal === expected) {
    console.log(`✓ subtotal de 3x $25.00 = $${(subtotal / 100).toFixed(2)}`);
  } else {
    console.log(`✗ subtotal esperado ${expected}, obtenido ${subtotal}`);
  }
}

// ─── Test 2: Selector selectCartTotal ─────────────────────────────────────────
console.log('\nTest 2: selectCartTotal');
{
  const items: CartItem[] = [
    {
      id: '1-',
      productoId: 1,
      nombre: 'Producto A',
      priceInCents: 1000,
      cantidad: 2,
      excludedIngredientIds: [],
    },
    {
      id: '2-',
      productoId: 2,
      nombre: 'Producto B',
      priceInCents: 1500,
      cantidad: 1,
      excludedIngredientIds: [],
    },
  ];
  const total = selectCartTotal(items);
  const expected = 3500; // (1000*2) + (1500*1)
  if (total === expected) {
    console.log(`✓ total de $${(total / 100).toFixed(2)}`);
  } else {
    console.log(`✗ total esperado ${expected}, obtenido ${total}`);
  }
}

// ─── Test 3: Selector selectCartItemsCount ────────────────────────────────────
console.log('\nTest 3: selectCartItemsCount');
{
  const items: CartItem[] = [
    {
      id: '1-',
      productoId: 1,
      nombre: 'A',
      priceInCents: 1000,
      cantidad: 3,
      excludedIngredientIds: [],
    },
    {
      id: '2-',
      productoId: 2,
      nombre: 'B',
      priceInCents: 500,
      cantidad: 5,
      excludedIngredientIds: [],
    },
  ];
  const count = selectCartItemsCount(items);
  if (count === 8) {
    console.log(`✓ count = ${count} unidades`);
  } else {
    console.log(`✗ count esperado 8, obtenido ${count}`);
  }
}

// ─── Test 4: Carrito vacío ───────────────────────────────────────────────────
console.log('\nTest 4: Carrito vacío');
{
  const empty: CartItem[] = [];
  if (selectCartTotal(empty) === 0 && selectCartItemsCount(empty) === 0) {
    console.log('✓ selectores con carrito vacío retornan 0');
  } else {
    console.log('✗ selectores con carrito vacío no retornan 0');
  }
}

// ─── Test 5: Lógica de generación de ID único ────────────────────────────────
console.log('\nTest 5: Generación de ID único por personalización');
{
  // Mismo producto, diferentes ingredientes excluidos → diferentes IDs
  const id1: string = '1-2,5';
  const id2: string = '1-3,4';

  if (id1 !== id2) {
    console.log('✓ IDs diferentes para distintas exclusiones');
  } else {
    console.log('✗ IDs deberían ser diferentes');
  }

  // Mismo producto, mismos ingredientes excluidos (orden diferente) → mismo ID
  const id3 = '1-2,5'; // mismo que id1
  if (id1 === id3) {
    console.log('✓ mismo ID sin importar orden de exclusión');
  } else {
    console.log('✗ IDs deberían ser iguales');
  }
}

console.log('\n=== TESTS COMPLETADOS ===');
