import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Store para la gestión de autenticación.
 * Almacena el token de acceso y la información del usuario autenticado.
 */
interface AuthState {
  accessToken: string | null;
  user: any | null;
  setAuth: (token: string, user: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setAuth: (token, user) => set({ accessToken: token, user }),
      logout: () => set({ accessToken: null, user: null }),
    }),
    {
      name: 'food-store-auth',
      // Persiste únicamente el token de acceso para mayor seguridad
      partialize: (state) => ({ accessToken: state.accessToken }),
    }
  )
);
