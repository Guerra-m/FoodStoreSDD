import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/Button";

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
      navigate("/");
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
      <Button
        variant="danger"
        onClick={handleLogout}
        disabled={isLoading}
        loading={isLoading}
        className={className}
      >
        Cerrar Sesión
      </Button>
    </>
  );
};
