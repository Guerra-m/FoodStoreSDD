/**
 * Types and interfaces for authentication feature
 */

export interface User {
  id: number;
  email: string;
  nombre: string;
  roles: string[];
  telefono: string | null;
  foto_url: string | null;
  fecha_nacimiento: string | null; // ISO date string (YYYY-MM-DD)
  creado_en: string; // ISO date string
  actualizado_en?: string; // ISO date string (opcional, nuevo auth no lo devuelve)
  eliminado_en?: string | null; // ISO date string (opcional, solo admin)
}

export interface AuthToken {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number; // seconds
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  nombre: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, nombre: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

export interface TokenPayload {
  sub: string; // user_id
  exp: number; // timestamp de expiración
}

// Alias for backward compatibility - same as User
export type UserResponse = User;
