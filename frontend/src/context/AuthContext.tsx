/**
 * Authentication Context and Provider
 * Gestiona el estado global de autenticación usando el sistema nuevo (/auth/*).
 * El refresh de tokens lo maneja el interceptor de axios (reactivo a 401).
 * NO hay schedule automático para evitar race conditions con el interceptor.
 * Los tokens se persisten en localStorage para sobrevivir entre pestañas.
 */

import React, { createContext, useState, useCallback, useEffect, ReactNode } from "react";
import { AuthContextType, User } from "../types/auth";
import { customerApi } from "../api/customers";
import {
  saveTokens,
  getTokens,
  clearTokens,
  isTokenExpired,
} from "../lib/auth";
import { useAuthStore } from "../stores/authStore";
import { toast } from "react-toastify";

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearAllAuth = useCallback(() => {
    clearTokens();
    setUser(null);
    useAuthStore.getState().logout();
  }, []);

  // ──────────────────────────────────────────
  // Refresca el token (usado por restoreSession)
  // ──────────────────────────────────────────
  const handleRefreshToken = useCallback(async () => {
    const { refreshToken } = getTokens();

    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const loginResponse = await customerApi.refresh(refreshToken);
    saveTokens(loginResponse.access_token, loginResponse.refresh_token);
    setUser(loginResponse.user);
    useAuthStore.getState().setAuth(loginResponse.access_token, loginResponse.user);
  }, []);

  // ──────────────────────────────────────────
  // Setea usuario desde token (restore session)
  // ──────────────────────────────────────────
  const setUserFromToken = useCallback(async (accessToken: string) => {
    const currentUser = await customerApi.getCurrentUser();
    setUser(currentUser);
    useAuthStore.getState().setAuth(accessToken, currentUser);
    return currentUser;
  }, []);

  // Escucha el evento auth:unauthorized disparado por axios interceptor
  const handleUnauthorized = useCallback(() => {
    toast.warning("Sesión expirada. Iniciá sesión nuevamente.");
    clearAllAuth();
  }, [clearAllAuth]);

  useEffect(() => {
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [handleUnauthorized]);

  // ──────────────────────────────────────────
  // Restaura sesión al montar — NUNCA destruye auth state
  // ──────────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      setIsLoading(true);
      try {
        // 1. Intentar desde zustand (persist), fallback a lib/auth
        let accessToken = useAuthStore.getState().accessToken;
        if (!accessToken) {
          const tokens = getTokens();
          if (tokens.accessToken) {
            accessToken = tokens.accessToken;
            // Sincronizar a zustand para que futuras recargas lo tengan
            useAuthStore.getState().setAuth(tokens.accessToken, null);
          }
        }

        if (!accessToken) {
          return; // No hay sesión que restaurar
        }

        // 2. Si expiró, intentar refresh
        if (isTokenExpired(accessToken)) {
          const { refreshToken } = getTokens();
          if (!refreshToken) return; // Sin refresh token, no se puede — el interceptor lo manejará
          try {
            await handleRefreshToken();
          } catch {
            // Refresh falló — no destruimos nada, el interceptor de axios
            // reintentará reactivamente en la próxima request
          }
          return;
        }

        // 3. Token válido — verificar contra backend
        try {
          await setUserFromToken(accessToken);
        } catch {
          // Backend no respondió — nos quedamos como estamos, el usuario
          // puede recargar o la próxima llamada gatillará refresh vía interceptor
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Zustand v4 auto-hidrata en el primer acceso. Restaurar sesión inmediatamente
    restoreSession();
  }, []);

  // ──────────────────────────────────────────
  // Login
  // ──────────────────────────────────────────
  const login = useCallback(
    async (email: string, password: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const loginResponse = await customerApi.login(email, password);
        saveTokens(loginResponse.access_token, loginResponse.refresh_token);
        setUser(loginResponse.user);
        useAuthStore.getState().setAuth(loginResponse.access_token, loginResponse.user);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Login fallido";
        setError(errorMessage);
        clearTokens();
        useAuthStore.getState().logout();
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // ──────────────────────────────────────────
  // Register
  // ──────────────────────────────────────────
  const register = useCallback(
    async (email: string, nombre: string, password: string) => {
      try {
        setIsLoading(true);
        setError(null);

        await customerApi.register(nombre, email, password);
        await login(email, password);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Registro fallido";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [login]
  );

  // ──────────────────────────────────────────
  // Logout
  // ──────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      const { refreshToken } = getTokens();

      if (refreshToken) {
        await customerApi.logout(refreshToken);
      }

      clearTokens();
      setUser(null);
      useAuthStore.getState().logout();
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Logout fallido";
      setError(errorMessage);
      clearTokens();
      setUser(null);
      useAuthStore.getState().logout();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ──────────────────────────────────────────
  // Clear error
  // ──────────────────────────────────────────
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Autenticado si tenemos user O un token persistido (aunque aún no se haya cargado el user)
  const isAuthenticated =
    user !== null ||
    !!useAuthStore.getState().accessToken ||
    !!getTokens().accessToken;

  const value: AuthContextType = {
    user,
    isLoading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    refreshToken: handleRefreshToken,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
