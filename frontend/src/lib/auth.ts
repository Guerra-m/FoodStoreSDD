/**
 * Utility functions for token management and authentication
 */

import { TokenPayload } from "../types/auth";

const ACCESS_TOKEN_KEY = "auth_access_token";
const REFRESH_TOKEN_KEY = "auth_refresh_token";

/**
 * Guarda tokens en localStorage (persistente, sobrevive a recargas y pestañas)
 */
export const saveTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

/**
 * Obtiene los tokens guardados
 */
export const getTokens = (): { accessToken: string | null; refreshToken: string | null } => {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  return { accessToken, refreshToken };
};

/**
 * Limpia los tokens guardados
 */
export const clearTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

/**
 * Obtiene solo el access token
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Obtiene solo el refresh token
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Verifica si un token JWT ha expirado
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    // Decodificar JWT (sin validar firma, solo parsear)
    const parts = token.split(".");
    if (parts.length !== 3) {
      return true;
    }

    const decoded = JSON.parse(atob(parts[1])) as TokenPayload;
    const expirationTime = decoded.exp * 1000; // convert to milliseconds
    const currentTime = Date.now();

    // Considerar expirado si quedan menos de 1 minuto
    return currentTime > expirationTime - 60000;
  } catch {
    return true;
  }
};

/**
 * Extrae el user_id de un JWT token
 */
export const getUserIdFromToken = (token: string): string | null => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const decoded = JSON.parse(atob(parts[1])) as TokenPayload;
    return decoded.sub || null;
  } catch {
    return null;
  }
};

/**
 * Valida que un email sea válido
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Valida que una contraseña cumpla con requisitos mínimos
 */
export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 8) {
    return {
      isValid: false,
      message: "La contraseña debe tener mínimo 8 caracteres",
    };
  }

  if (password.length > 255) {
    return {
      isValid: false,
      message: "La contraseña no puede exceder 255 caracteres",
    };
  }

  return { isValid: true };
};

/**
 * Calcula los segundos hasta que un token expire
 */
export const getTokenExpirationIn = (token: string): number | null => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const decoded = JSON.parse(atob(parts[1])) as TokenPayload;
    const expirationTime = decoded.exp * 1000;
    const currentTime = Date.now();
    const secondsRemaining = Math.floor((expirationTime - currentTime) / 1000);

    return secondsRemaining > 0 ? secondsRemaining : 0;
  } catch {
    return null;
  }
};
