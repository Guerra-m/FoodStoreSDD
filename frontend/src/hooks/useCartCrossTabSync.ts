import { useEffect } from 'react';
import { useCartStore } from '../stores/cartStore';
import { CART_STORAGE_KEY } from '../types/shopping-cart';

/**
 * Hook que sincroniza el carrito entre pestañas del navegador.
 * Escucha el evento `storage` que se dispara cuando otra pestaña
 * modifica el localStorage, y rehidrata el store si detecta cambios.
 */
export function useCartCrossTabSync(): void {
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === CART_STORAGE_KEY && event.newValue !== event.oldValue) {
        // Rehidratar el store desde localStorage
        void useCartStore.persist.rehydrate();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
}
