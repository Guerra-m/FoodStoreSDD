import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi, ProductoCreate, ProductoUpdate, ProductoFilters, StockUpdate } from '../api/products';

export const useProducts = (page = 1, perPage = 20) => {
  return useQuery({
    queryKey: ['products', 'admin', page, perPage],
    queryFn: () => productApi.getAll(page, perPage),
  });
};

export const useProductById = (id: number) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProductoCreate) => productApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', 'admin'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'public'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductoUpdate }) =>
      productApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', 'admin'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['products', 'public'], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ['product'], refetchType: 'all' });
    },
  });
};

export const useUpdateStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: StockUpdate }) =>
      productApi.updateStock(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', 'admin'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'public'] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => productApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', 'admin'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'public'] });
    },
  });
};

export const usePublicProducts = (filters?: ProductoFilters) => {
  return useQuery({
    queryKey: ['products', 'public', filters],
    queryFn: () => productApi.getPublic(filters),
    placeholderData: keepPreviousData,
  });
};

export const usePublicProductById = (id: number) => {
  return useQuery({
    queryKey: ['product', 'public', id],
    queryFn: () => productApi.getPublicById(id),
    enabled: !!id,
  });
};
