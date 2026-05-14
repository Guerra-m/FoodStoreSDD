import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, CartItemId, AddToCartParams, CartState, CartActions } from '../features/shopping-cart/types';
import { CART_STORAGE_KEY, CART_STORAGE_VERSION } from '../features/shopping-cart/types';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Genera un ID único para un item del carrito basado en el producto y
 * los ingredientes excluidos. Esto permite tener el mismo producto con
 * diferentes personalizaciones como items separados.
 */
function generateCartItemId(productoId: number, excludedIngredientIds: number[]): CartItemId {
  const sorted = [...excludedIngredientIds].sort((a, b) => a - b);
  return `${productoId}-${sorted.join(',')}`;
}

/**
 * Encuentra un item existente en el carrito con la misma configuración
 * (mismo producto e ingredientes excluidos).
 */
function findExistingItem(items: CartItem[], productoId: number, excludedIngredientIds: number[]): CartItem | undefined {
  const targetId = generateCartItemId(productoId, excludedIngredientIds);
  return items.find((item) => item.id === targetId);
}

// ─── Store ───────────────────────────────────────────────────────────────────

type CartStore = CartState & CartActions;

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      // ── Estado inicial ──
      items: [],

      // ── Acciones ──

      addItem: (params: AddToCartParams) =>
        set((state) => {
          const { productoId, nombre, priceInCents, cantidad = 1, excludedIngredientIds = [] } = params;

          // Si ya existe un item con la misma config, incrementar cantidad
          const existing = findExistingItem(state.items, productoId, excludedIngredientIds);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.id === existing.id
                  ? { ...item, cantidad: item.cantidad + cantidad }
                  : item,
              ),
            };
          }

          // Sino, crear nuevo item
          const newItem: CartItem = {
            id: generateCartItemId(productoId, excludedIngredientIds),
            productoId,
            nombre,
            priceInCents,
            cantidad,
            excludedIngredientIds,
          };

          return { items: [...state.items, newItem] };
        }),

      removeItem: (id: CartItemId) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      updateQuantity: (id: CartItemId, cantidad: number) =>
        set((state) => {
          if (cantidad <= 0) {
            return { items: state.items.filter((item) => item.id !== id) };
          }
          return {
            items: state.items.map((item) =>
              item.id === id ? { ...item, cantidad } : item,
            ),
          };
        }),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: CART_STORAGE_KEY,
      version: CART_STORAGE_VERSION,
    },
  ),
);

// ─── Selectores derivados ────────────────────────────────────────────────────

/** Retorna el precio total de todos los items en centavos */
export function selectCartTotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.priceInCents * item.cantidad, 0);
}

/** Retorna la cantidad total de items (sumando cantidades) */
export function selectCartItemsCount(items: CartItem[]): number {
  return items.reduce((count, item) => count + item.cantidad, 0);
}

/** Retorna el subtotal de un item individual en centavos */
export function selectItemSubtotal(item: CartItem): number {
  return item.priceInCents * item.cantidad;
}
