/**
 * ProtectedRoute Component
 * Wraps routes that require authentication and specific roles
 */

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAuthStore } from "../../../shared/stores/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const user = useAuthStore((state) => state.user);

  // Mostrar loading mientras se verifica la sesión
  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <p>Cargando...</p>
      </div>
    );
  }

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si tiene roles definidos y el usuario no tiene ninguno, redirigir a unauthorized
  if (allowedRoles && user && user.roles) {
    const hasRequiredRole = allowedRoles.some((role) => user.roles.includes(role));
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Si está autenticado y tiene permisos, renderizar el contenido
  return <>{children}</>;
};
