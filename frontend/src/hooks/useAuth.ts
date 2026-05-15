/**
 * Custom hook to access authentication context
 */

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { AuthContextType } from "../types/auth";

/**
 * Hook para acceder al contexto de autenticación
 * Debe ser usado dentro de un AuthProvider
 *
 * @returns AuthContextType con user, funciones de auth, etc.
 * @throws Error si no está dentro de AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe ser usado dentro de AuthProvider");
  }

  return context;
};
