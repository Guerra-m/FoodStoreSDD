import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { validateEmail } from "../../lib/auth";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { login, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!email) {
      errors.email = "Email requerido";
    } else if (!validateEmail(email)) {
      errors.email = "Email inválido";
    }

    if (!password) {
      errors.password = "Contraseña requerida";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
      setEmail("");
      setPassword("");
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al iniciar sesión";
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-100 p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Iniciar Sesión
        </h2>

        {(error || formError) && (
          <Alert variant="error" className="mb-4">{error || formError}</Alert>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="font-medium text-gray-700 text-sm">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError();
              }}
              placeholder="usuario@example.com"
              className={`px-3 py-2.5 border rounded-lg text-base transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                validationErrors.email ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isSubmitting}
              autoFocus
            />
            {validationErrors.email && (
              <span className="text-xs text-red-500">{validationErrors.email}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="font-medium text-gray-700 text-sm">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError();
              }}
              placeholder="••••••••"
              className={`px-3 py-2.5 border rounded-lg text-base transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                validationErrors.password ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isSubmitting}
            />
            {validationErrors.password && (
              <span className="text-xs text-red-500">{validationErrors.password}</span>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            loading={isSubmitting}
            className="mt-2"
          >
            Iniciar Sesión
          </Button>
        </form>

        <p className="text-center mt-4 text-sm text-gray-500">
          ¿No tienes cuenta?{" "}
          <a href="/register" className="text-blue-500 font-medium no-underline hover:underline">
            Regístrate aquí
          </a>
        </p>
        <p className="text-center mt-4 text-sm text-gray-500">User: admin@foodstore.com</p>
        <p className="text-center mt-4 text-sm text-gray-500">Password: admin123</p>
      </div>
    </div>
  );
};
