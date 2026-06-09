import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { validateEmail } from "../../lib/auth";
import { useAuthStore } from "../../stores/authStore";
import { Alert } from "../ui/Alert";
import { Button } from "../ui/Button";

interface LoginFormProps {
  onSuccess?: (user: any) => void;
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
      // Obtener el usuario desde authStore, que ya fue actualizado por login()
      const user = useAuthStore.getState().user;
      onSuccess?.(user);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al iniciar sesión";
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

          <h1 className="text-3xl font-bold text-neutral-900 mb-2">¡Bienvenido de nuevo!</h1>
          <p className="text-neutral-500 mb-8">Ingresá a tu cuenta para continuar</p>

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

            <Button
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
              className="w-full"
              size="lg"
            >
              Iniciar Sesión
            </Button>
          </form>

          <p className="text-center mt-8 text-neutral-500">
            ¿No tenés cuenta?{" "}
            <Link to="/register" className="link font-medium">
              Registrate aquí
            </Link>
          </p>

          {/* Demo credentials */}
          <div className="mt-8 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            <p className="text-xs font-medium text-neutral-500 mb-2">CREDENCIALES DE PRUEBA</p>
            <div className="text-sm text-neutral-600 space-y-1">
              <p><span className="font-medium">Admin:</span> admin@foodstore.com / admin123</p>
              <p><span className="font-medium">Cocinero:</span> cocinero@test.com / password123</p>
              <p><span className="font-medium">Cliente:</span> cliente@test.com / password123</p>
            </div>
          </div>
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-4">Tu tienda de comida online</h2>
          <p className="text-primary-100 text-lg">
            Disfrutá de los mejores productos con entrega rápida y pago seguro.
          </p>
        </div>
      </div>
    </div>
  );
};