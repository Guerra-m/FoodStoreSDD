import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { LoginForm } from "../../components/auth/LoginForm";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLoginSuccess = () => {
    // Redirigir a dashboard si es Admin, a landing page si no
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
