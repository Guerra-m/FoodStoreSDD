import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { validateEmail, validatePassword } from "../../lib/auth";

interface RegisterFormProps {
  onSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const { register, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!email) {
      errors.email = "Email requerido";
    } else if (!validateEmail(email)) {
      errors.email = "Email inválido";
    }

    if (!nombre) {
      errors.nombre = "Nombre requerido";
    } else if (nombre.length > 255) {
      errors.nombre = "Nombre no puede exceder 255 caracteres";
    }

    if (!password) {
      errors.password = "Contraseña requerida";
    } else {
      const { isValid, message } = validatePassword(password);
      if (!isValid) {
        errors.password = message || "Contraseña inválida";
      }
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Confirmación de contraseña requerida";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Las contraseñas no coinciden";
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

    try {
      await register(email, nombre, password);
      setEmail("");
      setNombre("");
      setPassword("");
      setConfirmPassword("");
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al registrarse";
      setFormError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-100 p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Crear Cuenta
        </h2>

        {(error || formError) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-lg text-sm text-red-600">
            {error || formError}
          </div>
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
              disabled={isLoading}
              autoFocus
            />
            {validationErrors.email && (
              <span className="text-xs text-red-500">{validationErrors.email}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="nombre" className="font-medium text-gray-700 text-sm">
              Nombre Completo
            </label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                clearError();
              }}
              placeholder="Juan García"
              className={`px-3 py-2.5 border rounded-lg text-base transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                validationErrors.nombre ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isLoading}
            />
            {validationErrors.nombre && (
              <span className="text-xs text-red-500">{validationErrors.nombre}</span>
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
              disabled={isLoading}
            />
            {validationErrors.password && (
              <span className="text-xs text-red-500">{validationErrors.password}</span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirmPassword" className="font-medium text-gray-700 text-sm">
              Confirmar Contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearError();
              }}
              placeholder="••••••••"
              className={`px-3 py-2.5 border rounded-lg text-base transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                validationErrors.confirmPassword ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isLoading}
            />
            {validationErrors.confirmPassword && (
              <span className="text-xs text-red-500">{validationErrors.confirmPassword}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 px-4 py-2.5 bg-green-500 text-white font-medium rounded-lg text-base transition-colors hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
          </button>
        </form>

        <p className="text-center mt-4 text-sm text-gray-500">
          ¿Ya tienes cuenta?{" "}
          <a href="/login" className="text-blue-500 font-medium no-underline hover:underline">
            Inicia sesión aquí
          </a>
        </p>
      </div>
    </div>
  );
};
