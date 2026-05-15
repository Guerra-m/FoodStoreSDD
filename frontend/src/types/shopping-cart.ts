/** ID único generado a partir del producto + personalización */
export type CartItemId = string;

/** Representa un item en el carrito con su personalización */
export interface CartItem {
  /** ID único generado (hash de productoId + ingredientes excluidos) */
  id: CartItemId;
  /** ID del producto original */
  productoId: number;
  /** Nombre del producto (snapshot al agregar) */
  nombre: string;
  /** Precio unitario en centavos (snapshot al agregar) */
  priceInCents: number;
  /** Cantidad seleccionada */
  cantidad: number;
  /** IDs de ingredientes que el usuario excluyó */
  excludedIngredientIds: number[];
}

/** Parámetros para agregar un producto al carrito */
export interface AddToCartParams {
  productoId: number;
  nombre: string;
  priceInCents: number;
  cantidad?: number;
  excludedIngredientIds?: number[];
}

/** Acciones expuestas por el store del carrito */
export interface CartActions {
  addItem: (params: AddToCartParams) => void;
  removeItem: (id: CartItemId) => void;
  updateQuantity: (id: CartItemId, cantidad: number) => void;
  clearCart: () => void;
}

/** Estado completo del store del carrito */
export interface CartState {
  items: CartItem[];
}

/** Selectores derivados del carrito */
export interface CartSelectors {
  selectCartTotal: (items: CartItem[]) => number;
  selectCartItemsCount: (items: CartItem[]) => number;
  selectItemSubtotal: (item: CartItem) => number;
}

/** Estructura del store persistido en localStorage */
export interface CartPersistedState {
  state: CartState;
  version: number;
}

/** Clave usada en localStorage */
export const CART_STORAGE_KEY = 'food-store-cart';

/** Versión actual del schema de persistencia */
export const CART_STORAGE_VERSION = 1;
