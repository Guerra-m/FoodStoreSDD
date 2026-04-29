import { create } from 'zustand';

interface UIState {
  cartOpen: boolean;
  toggleCart: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  cartOpen: false,
  toggleCart: () => set((state) => ({ cartOpen: !state.cartOpen })),
}));
