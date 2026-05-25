import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types/auth';

/**
 * Store para la gestión de autenticación.
 * Almacena el token de acceso y la información del usuario autenticado.
 * isRestoringSession previene múltiples llamadas simultáneas a restoreSession.
 */
interface AuthState {
  accessToken: string | null;
  user: User | null;
  isRestoringSession: boolean;
  setAuth: (token: string, user: User | null) => void;
  logout: () => void;
  setRestoringSession: (restoring: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isRestoringSession: false,
      setAuth: (token, user) => set({ accessToken: token, user }),
      logout: () => set({ accessToken: null, user: null, isRestoringSession: false }),
      setRestoringSession: (restoring) => set({ isRestoringSession: restoring }),
    }),
    {
      name: 'food-store-auth',
      // Persiste accessToken y user para que sobrevivan a recargas de página
      // NO persistir isRestoringSession (es volátil, solo para app lifetime)
      partialize: (state) => ({ accessToken: state.accessToken, user: state.user }),
    }
  )
);
