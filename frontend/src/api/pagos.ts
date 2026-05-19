import api from './axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PagoResponse {
  id: number;
  pedido_id: number;
  mp_payment_id: number | null;
  mp_status: string;
  status_detail: string | null;
  external_reference: string;
  created_at: string;
}

export interface PagoCreateRequest {
  card_token: string;
  pedido_id: number;
}

export interface PreferenciaResponse {
  preference_id: string;
  init_point: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const pagoApi = {
  /** Crea un pago con el token de la tarjeta obtenido del SDK de MercadoPago */
  crearPago: async (data: PagoCreateRequest): Promise<PagoResponse> => {
    const response = await api.post('/pagos/crear', data);
    return response.data;
  },

  /** Crea una preferencia de MercadoPago Checkout Pro con back_urls */
  crearPreferencia: async (pedidoId: number): Promise<PreferenciaResponse> => {
    const response = await api.post('/pagos/crear-preferencia', { pedido_id: pedidoId });
    return response.data;
  },

  /** Obtiene el pago asociado a un pedido */
  getPagoByPedido: async (pedidoId: number): Promise<PagoResponse> => {
    const response = await api.get(`/pagos/${pedidoId}`);
    return response.data;
  },
};
