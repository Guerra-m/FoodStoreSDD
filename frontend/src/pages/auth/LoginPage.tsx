import React from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "../../components/auth/LoginForm";
import type { User } from "../../types/auth";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = (user: User | null) => {
    // Redirigir a dashboard si es Admin, a home si no
    if (user?.roles?.includes("Admin")) {
      navigate("/admin");
    } else {
      navigate("/");
    }
  };

  return (
    <div>
      <LoginForm onSuccess={handleLoginSuccess} />
    </div>
  );
};
