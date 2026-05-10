/**
 * LogoutButton Component
 * Simple button to trigger logout
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import styles from "./LogoutButton.module.css";

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
        <div className={styles.errorAlert}>
          {error}
        </div>
      )}
      <button
        onClick={handleLogout}
        disabled={isLoading}
        className={`${styles.button} ${className || ""}`}
      >
        {isLoading ? "Cerrando sesión..." : "Cerrar Sesión"}
      </button>
    </>
  );
};
