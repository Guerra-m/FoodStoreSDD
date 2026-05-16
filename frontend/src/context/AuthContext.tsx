/**
 * Authentication Context and Provider
 * Gestiona el estado global de autenticación usando el sistema nuevo (/auth/*).
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
  // Refresca el token
  // ──────────────────────────────────────────
  const handleRefreshToken = useCallback(async () => {
    try {
      const { refreshToken } = getTokens();

      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      // El nuevo /auth/refresh devuelve user + tokens
      const loginResponse = await customerApi.refresh(refreshToken);
      saveTokens(loginResponse.access_token, loginResponse.refresh_token);
      setUser(loginResponse.user);
      useAuthStore.getState().setAuth(loginResponse.access_token, loginResponse.user);
      scheduleTokenRefresh(loginResponse.access_token);
    } catch (err) {
      clearAllAuth();
      const errorMessage = err instanceof Error ? err.message : "Token refresh fallido";
      setError(errorMessage);
      console.error("Token refresh failed:", err);
    }
  }, [clearAllAuth, scheduleTokenRefresh]);

  // ──────────────────────────────────────────
  // Setea usuario desde token (restore session)
  // ──────────────────────────────────────────
  const setUserFromToken = useCallback(async (accessToken: string) => {
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

        await setUserFromToken(accessToken);
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

        // El nuevo /auth/login devuelve user + tokens en una sola llamada
        const loginResponse = await customerApi.login(email, password);
        saveTokens(loginResponse.access_token, loginResponse.refresh_token);
        setUser(loginResponse.user);
        useAuthStore.getState().setAuth(loginResponse.access_token, loginResponse.user);
        scheduleTokenRefresh(loginResponse.access_token);
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
    [scheduleTokenRefresh]
  );

  // ──────────────────────────────────────────
  // Register
  // ──────────────────────────────────────────
  const register = useCallback(
    async (email: string, nombre: string, password: string) => {
      try {
        setIsLoading(true);
        setError(null);

        // El nuevo /auth/register devuelve el usuario creado
        await customerApi.register(nombre, email, password);
        // Loguear automáticamente después de registrar
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
