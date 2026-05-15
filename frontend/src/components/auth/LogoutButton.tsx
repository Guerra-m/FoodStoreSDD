import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface LogoutButtonProps {
  className?: string;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({ className }) => {
  const { logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      setError(null);
      await logout();
      navigate("/login");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al cerrar sesión";
      setError(errorMessage);
    }
  };

  return (
    <>
      {error && (
        <div className="mb-2 p-2 bg-red-50 border border-red-300 rounded text-xs text-red-600">
          {error}
        </div>
      )}
      <button
        onClick={handleLogout}
        disabled={isLoading}
        className={`px-4 py-2 bg-red-500 text-white font-medium rounded text-sm transition-colors hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed ${className || ""}`}
      >
        {isLoading ? "Cerrando sesión..." : "Cerrar Sesión"}
      </button>
    </>
  );
};
