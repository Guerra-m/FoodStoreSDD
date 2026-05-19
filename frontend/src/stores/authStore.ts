import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/auth';

/**
 * Store para la gestión de autenticación.
 * Almacena el token de acceso y la información del usuario autenticado.
 */
interface AuthState {
  accessToken: string | null;
  user: User | null;
  setAuth: (token: string, user: User | null) => void;
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
      // Persiste accessToken y user para que sobrevivan a recargas de página
      partialize: (state) => ({ accessToken: state.accessToken, user: state.user }),
    }
  )
);
