import React from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "../../components/auth/LoginForm";
import type { User } from "../../types/auth";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = (user: User | null) => {
    // Redirigir según el rol del usuario
    if (user?.roles?.includes("Admin")) {
      navigate("/admin");
    } else if (user?.roles?.includes("Cocinero")) {
      navigate("/admin/orders");
    } else {
      navigate("/catalog");
    }
  };

  return (
    <div>
      <LoginForm onSuccess={handleLoginSuccess} />
    </div>
  );
};
