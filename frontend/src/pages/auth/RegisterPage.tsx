import React from "react";
import { useNavigate } from "react-router-dom";
import { RegisterForm } from "../../components/auth/RegisterForm";

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const handleRegisterSuccess = () => {
    navigate("/");
  };

  return (
    <div>
      <RegisterForm onSuccess={handleRegisterSuccess} />
    </div>
  );
};
