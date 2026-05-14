/**
 * Authentication Context and Provider
 * Manages global authentication state and provides auth functions
 */

import React, { createContext, useState, useCallback, useEffect, ReactNode } from "react";
import { AuthContextType, User } from "../types";
import {
  loginUser,
  registerUser,
  logoutUser,
  getCurrentUser,
  refreshAccessToken,
} from "../services/authApi";
import {
  saveTokens,
  getTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  isTokenExpired,
} from "../utils";
import { useAuthStore } from "../../../shared/stores/authStore";

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTimeoutId, setRefreshTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Limpia timeout si existe
  const clearRefreshTimeout = useCallback(() => {
    if (refreshTimeoutId) {
      clearTimeout(refreshTimeoutId);
      setRefreshTimeoutId(null);
    }
  }, [refreshTimeoutId]);

  /**
   * Limpia TODO el estado de autenticación (context, store, tokens)
   */
  const clearAllAuth = useCallback(() => {
    clearTokens();
    setUser(null);
    useAuthStore.getState().logout();
    clearRefreshTimeout();
  }, [clearRefreshTimeout]);

  // Escucha el evento auth:unauthorized disparado por axios interceptor
  // Así cuando una API call recibe 401, AuthContext reacciona sin necesidad
  // de recargar la página entera.
  const handleUnauthorized = useCallback(() => {
    clearAllAuth();
  }, [clearAllAuth]);

  useEffect(() => {
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [handleUnauthorized]);

  // Intenta restaurar sesión existente al montar
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { accessToken } = getTokens();

        if (!accessToken) {
          return;
        }

        // Si token expiró, intentar refresh
        if (isTokenExpired(accessToken)) {
          const { refreshToken } = getTokens();
          if (refreshToken) {
            await handleRefreshToken();
          } else {
            clearTokens();
          }
          return;
        }

        // Token válido, obtener usuario
        const currentUser = await getCurrentUser(accessToken);
        setUser(currentUser);
        useAuthStore.getState().setAuth(accessToken, currentUser);
        scheduleTokenRefresh(accessToken);
      } catch (err) {
        console.error("Error restoring session:", err);
        clearAllAuth();
      }
    };

    restoreSession();
  }, []);

  /**
   * Programa el refresh automático del token
   * Se ejecuta 1 minuto antes de que expire
   */
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

  /**
   * Realiza el login del usuario
   */
  const login = useCallback(
    async (email: string, password: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await loginUser(email, password);

        setUser(response.user);
        saveTokens(response.access_token, response.refresh_token);
        useAuthStore.getState().setAuth(response.access_token, response.user);
        scheduleTokenRefresh(response.access_token);
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

  /**
   * Registra un nuevo usuario
   */
  const register = useCallback(
    async (email: string, nombre: string, password: string) => {
      try {
        setIsLoading(true);
        setError(null);

        await registerUser(email, nombre, password);

        // Después de registrar, auto-login
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

  /**
   * Realiza logout del usuario
   */
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      const { refreshToken } = getTokens();

      if (refreshToken) {
        await logoutUser(refreshToken);
      }

      clearTokens();
      setUser(null);
      useAuthStore.getState().logout();
      clearRefreshTimeout();
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Logout fallido";
      setError(errorMessage);
      // Aún así limpiamos el estado local aunque falle
      clearTokens();
      setUser(null);
      useAuthStore.getState().logout();
      clearRefreshTimeout();
    } finally {
      setIsLoading(false);
    }
  }, [clearRefreshTimeout]);

  /**
   * Renueva el access token usando el refresh token
   */
  const handleRefreshToken = useCallback(async () => {
    try {
      const { refreshToken } = getTokens();

      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await refreshAccessToken(refreshToken);

      setUser(response.user);
      saveTokens(response.access_token, response.refresh_token);
      useAuthStore.getState().setAuth(response.access_token, response.user);
      scheduleTokenRefresh(response.access_token);
    } catch (err) {
      // Si falla el refresh, limpiamos todo
      clearAllAuth();
      const errorMessage = err instanceof Error ? err.message : "Token refresh fallido";
      setError(errorMessage);
      console.error("Token refresh failed:", err);
    }
  }, [scheduleTokenRefresh, clearAllAuth]);

  /**
   * Limpia el mensaje de error
   */
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
