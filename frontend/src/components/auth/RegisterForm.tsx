import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { validateEmail, validatePassword } from "../../lib/auth";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";

interface RegisterFormProps {
  onSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const { register, error, clearError } = useAuth();
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-neutral-900">FoodStore</span>
          </div>

          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Crear Cuenta</h1>
          <p className="text-neutral-500 mb-8">¡Unite a nuestra comunidad!</p>

          {(error || formError) && (
            <Alert variant="error" className="mb-6">{error || formError}</Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="input-label">
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
                placeholder="tu@email.com"
                className={`input-field ${validationErrors.email ? 'input-field-error' : ''}`}
                disabled={isSubmitting}
                autoFocus
              />
              {validationErrors.email && (
                <span className="input-error">{validationErrors.email}</span>
              )}
            </div>

            <div>
              <label htmlFor="nombre" className="input-label">
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
                className={`input-field ${validationErrors.nombre ? 'input-field-error' : ''}`}
                disabled={isSubmitting}
              />
              {validationErrors.nombre && (
                <span className="input-error">{validationErrors.nombre}</span>
              )}
            </div>

            <div>
              <label htmlFor="password" className="input-label">
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
                className={`input-field ${validationErrors.password ? 'input-field-error' : ''}`}
                disabled={isSubmitting}
              />
              {validationErrors.password && (
                <span className="input-error">{validationErrors.password}</span>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="input-label">
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
                className={`input-field ${validationErrors.confirmPassword ? 'input-field-error' : ''}`}
                disabled={isSubmitting}
              />
              {validationErrors.confirmPassword && (
                <span className="input-error">{validationErrors.confirmPassword}</span>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
              className="w-full"
              size="lg"
            >
              Crear Cuenta
            </Button>
          </form>

          <p className="text-center mt-8 text-neutral-500">
            ¿Ya tenés cuenta?{" "}
            <Link to="/login" className="link font-medium">
              Iniciá sesión aquí
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-primary-400/20 to-primary-600/20 rounded-full blur-3xl" />
        </div>

        <div className="relative text-white max-w-lg text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-white/10 backdrop-blur flex items-center justify-center">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-4">¡Únete a FoodStore!</h2>
          <p className="text-primary-100 text-lg">
            Creá tu cuenta y empezá a disfrutar de los mejores productos con entrega rápida.
          </p>
        </div>
      </div>
    </div>
  );
};