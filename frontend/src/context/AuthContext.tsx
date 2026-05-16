/**
 * Authentication Context and Provider
 * Gestiona el estado global de autenticación usando el sistema nuevo (/api/v1/auth/*).
 * Los access tokens se persisten en zustand (localStorage), los refresh tokens en sessionStorage.
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

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTimeoutId, setRefreshTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

  // ──────────────────────────────────────────
  // Helpers (sin dependencias circulares)
  // ──────────────────────────────────────────

  const clearRefreshTimeout = useCallback(() => {
    if (refreshTimeoutId) {
      clearTimeout(refreshTimeoutId);
      setRefreshTimeoutId(null);
    }
  }, [refreshTimeoutId]);

  const clearAllAuth = useCallback(() => {
    clearTokens();
    setUser(null);
    useAuthStore.getState().logout();
    clearRefreshTimeout();
  }, [clearRefreshTimeout]);

  // ──────────────────────────────────────────
  // Programa el refresh automático del token
  // ──────────────────────────────────────────
  const scheduleTokenRefresh = useCallback((accessToken: string) => {
    clearRefreshTimeout();

    try {
      const parts = accessToken.split(".");
      if (parts.length !== 3) return;

      const decoded = JSON.parse(atob(parts[1])) as { exp: number };
      const expirationTime = decoded.exp * 1000;
      const currentTime = Date.now();
      const timeUntilExpiry = expirationTime - currentTime - 60000; // 1 minuto antes

      if (timeUntilExpiry > 0) {
        const timeoutId = setTimeout(() => {
          handleRefreshToken();
        }, timeUntilExpiry);

        setRefreshTimeoutId(timeoutId);
      }
    } catch (err) {
      console.error("Error scheduling token refresh:", err);
    }
  }, [clearRefreshTimeout]);

  // ──────────────────────────────────────────
  // Refresca el token (declarado antes de scheduleTokenRefresh por si se invoca en el timeout)
  // ──────────────────────────────────────────
  const handleRefreshToken = useCallback(async () => {
    try {
      const { refreshToken } = getTokens();

      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      // 1. Refresh → obtiene nuevos tokens
      const tokens = await customerApi.refresh(refreshToken);
      saveTokens(tokens.access_token, tokens.refresh_token);

      // 2. Obtener perfil actualizado
      await fetchAndSetUser(tokens.access_token);
    } catch (err) {
      clearAllAuth();
      const errorMessage = err instanceof Error ? err.message : "Token refresh fallido";
      setError(errorMessage);
      console.error("Token refresh failed:", err);
    }
  }, [clearAllAuth]);

  // ──────────────────────────────────────────
  // Obtiene perfil + actualiza stores
  // ──────────────────────────────────────────
  const fetchAndSetUser = useCallback(async (accessToken: string) => {
    const currentUser = await customerApi.getCurrentUser();
    setUser(currentUser);
    useAuthStore.getState().setAuth(accessToken, currentUser);
    scheduleTokenRefresh(accessToken);
    return currentUser;
  }, [scheduleTokenRefresh]);

  // Escucha el evento auth:unauthorized disparado por axios interceptor
  const handleUnauthorized = useCallback(() => {
    clearAllAuth();
  }, [clearAllAuth]);

  useEffect(() => {
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [handleUnauthorized]);

  // ──────────────────────────────────────────
  // Restaura sesión al montar
  // ──────────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      setIsLoading(true);
      try {
        const accessToken = useAuthStore.getState().accessToken;

        if (!accessToken) {
          return;
        }

        if (isTokenExpired(accessToken)) {
          const { refreshToken } = getTokens();
          if (refreshToken) {
            await handleRefreshToken();
          } else {
            clearAllAuth();
          }
          return;
        }

        await fetchAndSetUser(accessToken);
      } catch (err) {
        console.error("Error restoring session:", err);
        clearAllAuth();
      } finally {
        setIsLoading(false);
      }
    };

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

        const tokens = await customerApi.login(email, password);
        saveTokens(tokens.access_token, tokens.refresh_token);

        const currentUser = await fetchAndSetUser(tokens.access_token);
        setUser(currentUser);
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
    [fetchAndSetUser]
  );

  // ──────────────────────────────────────────
  // Register
  // ──────────────────────────────────────────
  const register = useCallback(
    async (email: string, nombre: string, password: string) => {
      try {
        setIsLoading(true);
        setError(null);

        // Register devuelve los datos del usuario, pero igual hacemos login
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
      clearRefreshTimeout();
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Logout fallido";
      setError(errorMessage);
      clearTokens();
      setUser(null);
      useAuthStore.getState().logout();
      clearRefreshTimeout();
    } finally {
      setIsLoading(false);
    }
  }, [clearRefreshTimeout]);

  // ──────────────────────────────────────────
  // Clear error
  // ──────────────────────────────────────────
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const isAuthenticated = user !== null;

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
