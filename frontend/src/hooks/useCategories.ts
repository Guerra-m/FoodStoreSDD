import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryApi, CategoriaCreate, CategoriaUpdate } from '../api/categories';

export const useCategories = (padreId?: number) => {
  return useQuery({
    queryKey: ['categorias', padreId],
    queryFn: () => categoryApi.getAll(padreId),
  });
};

export const useCategoriaTree = () => {
  return useQuery({
    queryKey: ['categorias-tree'],
    queryFn: () => categoryApi.getTree(),
  });
};

export const useCategoriaById = (id: number) => {
  return useQuery({
    queryKey: ['categoria', id],
    queryFn: () => categoryApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateCategoria = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CategoriaCreate) => categoryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      queryClient.invalidateQueries({ queryKey: ['categorias-tree'] });
    },
  });
};

export const useUpdateCategoria = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoriaUpdate }) =>
      categoryApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      queryClient.invalidateQueries({ queryKey: ['categorias-tree'] });
    },
  });
};

export const useDeleteCategoria = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => categoryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categorias'] });
      queryClient.invalidateQueries({ queryKey: ['categorias-tree'] });
    },
  });
};