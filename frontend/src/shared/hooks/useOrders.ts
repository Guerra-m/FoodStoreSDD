import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi, CartItem, OrderResponse, OrderListResponse } from '../api/orderApi';

// Hook para listar pedidos del cliente
export const useOrders = (page = 1, perPage = 20) => {
  return useQuery({
    queryKey: ['orders', 'list', page, perPage],
    queryFn: () => orderApi.list(page, perPage),
  });
};

// Hook para obtener un pedido por ID
export const useOrderById = (orderId: number | null) => {
  return useQuery({
    queryKey: ['orders', 'detail', orderId],
    queryFn: () => orderApi.getById(orderId!),
    enabled: !!orderId,
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