/**
 * RegisterForm Component
 * Form for user registration with email, name, and password
 */

import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { validateEmail, validatePassword } from "../utils";
import styles from "./RegisterForm.module.css";

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
    <div className={styles.container}>
      <h2 className={styles.title}>Crear Cuenta</h2>

      {(error || formError) && (
        <div className={styles.errorAlert}>
          {error || formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>
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
            className={`${styles.input} ${validationErrors.email ? styles.inputError : ""}`}
            disabled={isLoading}
            autoFocus
          />
          {validationErrors.email && (
            <span className={styles.errorText}>{validationErrors.email}</span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="nombre" className={styles.label}>
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
            className={`${styles.input} ${validationErrors.nombre ? styles.inputError : ""}`}
            disabled={isLoading}
          />
          {validationErrors.nombre && (
            <span className={styles.errorText}>{validationErrors.nombre}</span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="password" className={styles.label}>
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
            className={`${styles.input} ${validationErrors.password ? styles.inputError : ""}`}
            disabled={isLoading}
          />
          {validationErrors.password && (
            <span className={styles.errorText}>{validationErrors.password}</span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="confirmPassword" className={styles.label}>
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
            className={`${styles.input} ${validationErrors.confirmPassword ? styles.inputError : ""}`}
            disabled={isLoading}
          />
          {validationErrors.confirmPassword && (
            <span className={styles.errorText}>{validationErrors.confirmPassword}</span>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={styles.submitButton}
        >
          {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
        </button>
      </form>

      <p className={styles.footer}>
        ¿Ya tienes cuenta? <a href="/login" className={styles.link}>Inicia sesión aquí</a>
      </p>
    </div>
  );
};
