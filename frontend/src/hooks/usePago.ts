import { useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { pagoApi, PagoCreateRequest, PagoResponse } from '../api/pagos';

/**
 * Hook para crear un pago (mutación).
 * Envía el token de tarjeta obtenido del SDK de MercadoPago junto con el pedido_id.
 */
export const useCreatePayment = () => {
  return useMutation({
    mutationFn: (data: PagoCreateRequest) => pagoApi.crearPago(data),
  });
};

/**
 * Hook que consulta el estado del pago asociado a un pedido.
 * Cuando `pollingEnabled` es true, hace polling cada 5s por hasta 60s,
 * o hasta obtener un estado terminal (approved / rejected).
 *
 * @param pedidoId       ID del pedido a consultar
 * @param pollingEnabled Activa el polling automático (true después de crear el pago)
 */
export const usePagoByPedido = (
  pedidoId: number | null,
  pollingEnabled = false,
) => {
  const pollStartRef = useRef<number | null>(null);

  // Reinicia el contador de tiempo cuando se activa/desactiva el polling
  if (pollingEnabled && pollStartRef.current === null) {
    pollStartRef.current = Date.now();
  }
  if (!pollingEnabled) {
    pollStartRef.current = null;
  }

  return useQuery<PagoResponse>({
    queryKey: ['pago', pedidoId],
    queryFn: () => pagoApi.getPagoByPedido(pedidoId!),
    enabled: !!pedidoId && pollingEnabled,

    refetchInterval: (query) => {
      // Si recibimos estado terminal, dejar de pollear
      if (query.state.data) {
        const terminal: string[] = ['approved', 'rejected'];
        if (terminal.includes(query.state.data.mp_status)) return false;
      }

      // Timeout de seguridad: dejar de pollear después de 2 minutos
      if (
        pollStartRef.current &&
        Date.now() - pollStartRef.current > 120_000
      ) {
        return false;
      }

      return 5_000;
    },

    // Mantener datos en caché mientras se refresca en background
    staleTime: 4_000,
  });
};
