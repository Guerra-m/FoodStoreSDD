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

// ─── API ──────────────────────────────────────────────────────────────────────

export const pagoApi = {
  /** Crea un pago con el token de la tarjeta obtenido del SDK de MercadoPago */
  crearPago: async (data: PagoCreateRequest): Promise<PagoResponse> => {
    const response = await api.post('/api/v1/pagos/crear', data);
    return response.data;
  },

  /** Obtiene el pago asociado a un pedido */
  getPagoByPedido: async (pedidoId: number): Promise<PagoResponse> => {
    const response = await api.get(`/api/v1/pagos/${pedidoId}`);
    return response.data;
  },
};
