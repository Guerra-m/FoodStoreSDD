/**
 * @deprecated Usar `customerApi` de `./customers` en su lugar.
 * Este archivo usa el sistema viejo de auth (/auth/*) con fetch nativo.
 * El nuevo sistema (/api/v1/auth/*) con axios y refresh automático está en customers.ts.
 */

import {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  UserResponse,
} from "../types/auth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Realiza una petición con headers apropriados
 */
const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
};

/**
 * Registra un nuevo usuario
 */
export const registerUser = async (
  email: string,
  nombre: string,
  password: string
): Promise<UserResponse> => {
  const request: RegisterRequest = {
    email,
    nombre,
    password,
  };

  return apiCall<UserResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(request),
  });
};

/**
 * Autentica un usuario (login)
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const request: LoginRequest = {
    email,
    password,
  };

  return apiCall<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(request),
  });
};

/**
 * Renueva el access token usando el refresh token
 */
export const refreshAccessToken = async (
  refreshToken: string
): Promise<LoginResponse> => {
  return apiCall<LoginResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
};

/**
 * Cierra sesión revocando el refresh token
 */
export const logoutUser = async (refreshToken: string): Promise<void> => {
  await apiCall<{ message: string }>("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
};

/**
 * Obtiene el perfil del usuario actual
 */
export const getCurrentUser = async (
  accessToken: string
): Promise<UserResponse> => {
  return apiCall<UserResponse>("/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
};
