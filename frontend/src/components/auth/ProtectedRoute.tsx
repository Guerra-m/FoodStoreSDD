/**
 * ProtectedRoute Component
 * 
 * CRITICAL FIX: Shows loading spinner while session is being restored
 * Prevents premature redirect to login during isRestoringSession phase
 * 
 * Checks:
 * 1. If isLoading OR isRestoringSession → show spinner
 * 2. If authenticated and authorized → render children
 * 3. If not authenticated → redirect to /login
 * 4. If authenticated but unauthorized (role) → redirect to /unauthorized
 */

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useAuthStore } from "../../stores/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const user = useAuthStore((state) => state.user);
  const isRestoringSession = useAuthStore((state) => state.isRestoringSession);

  // Mostrar loading mientras se verifica la sesión O se restaura
  if (isLoading || isRestoringSession) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Restaurando sesión...</p>
        </div>
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
