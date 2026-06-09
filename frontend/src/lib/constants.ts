/**
 * Shared application constants
 */

// ─── API ───────────────────────────────────────────
/** Base URL for API requests (from env) */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8006/api/v1";

/** MercadoPago public key (from env) */
export const MERCADOPAGO_PUBLIC_KEY: string | undefined =
  import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;

// ─── Pagination ────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;

// ─── Toast ─────────────────────────────────────────
export const TOAST_DURATION_MS = 3000;

// ─── Order status ──────────────────────────────────
export const ORDER_STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  preparacion: "En preparación",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
  pagado: "Pagado",
};
