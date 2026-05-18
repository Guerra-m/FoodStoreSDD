import { create } from 'zustand';

export interface PendingToast {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

/**
 * Store para gestionar el estado de la UI global.
 * Controla elementos visuales transversales como el carrito y toasts pendientes.
 */
interface UIState {
  cartOpen: boolean;
  toggleCart: () => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  /** Toast pendiente para mostrar después de una navegación/redirect */
  pendingToast: PendingToast | null;
  setPendingToast: (toast: PendingToast) => void;
  clearPendingToast: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  cartOpen: false,
  toggleCart: () => set((state) => ({ cartOpen: !state.cartOpen })),

  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),

  pendingToast: null,
  setPendingToast: (toast) => set({ pendingToast: toast }),
  clearPendingToast: () => set({ pendingToast: null }),
}));
