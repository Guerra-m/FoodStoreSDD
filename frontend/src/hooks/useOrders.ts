import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi, CartItem, OrderResponse, OrderListResponse } from '../api/orders';

interface UseOrdersOptions {
  /** Intervalo de polling en ms (opcional, default: sin polling) */
  refetchInterval?: number | false;
}

// Hook para listar pedidos del cliente
export const useOrders = (page = 1, perPage = 20, options?: UseOrdersOptions) => {
  return useQuery({
    queryKey: ['orders', 'list', page, perPage],
    queryFn: () => orderApi.list(page, perPage),
    refetchInterval: options?.refetchInterval,
  });
};

interface UseOrderByIdOptions {
  /** Intervalo de polling en ms (opcional) */
  refetchInterval?: number | false;
}

// Hook para obtener un pedido por ID
export const useOrderById = (orderId: number | null, options?: UseOrderByIdOptions) => {
  return useQuery({
    queryKey: ['orders', 'detail', orderId],
    queryFn: () => orderApi.getById(orderId!),
    enabled: !!orderId,
    refetchInterval: options?.refetchInterval,
  });
};

// Hook para obtener historial de un pedido
export const useOrderHistorial = (orderId: number | null) => {
  return useQuery({
    queryKey: ['orders', 'historial', orderId],
    queryFn: () => orderApi.getHistorial(orderId!),
    enabled: !!orderId,
  });
};

// Hook para crear un pedido
export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      carrito,
      direccionId,
    }: {
      carrito: CartItem[];
      direccionId: number;
    }) => orderApi.create(carrito, direccionId),
    onSuccess: () => {
      // Invalidar queries de pedidos y limpiar el carrito
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
};