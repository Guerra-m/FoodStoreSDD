import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ingredientApi, IngredienteCreate, IngredienteUpdate } from '../api/ingredients';

export const useIngredientes = () => {
  return useQuery({
    queryKey: ['ingredientes'],
    queryFn: () => ingredientApi.getAll(),
  });
};

export const useIngredienteById = (id: number) => {
  return useQuery({
    queryKey: ['ingrediente', id],
    queryFn: () => ingredientApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateIngrediente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: IngredienteCreate) => ingredientApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredientes'] });
    },
  });
};

export const useUpdateIngrediente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: IngredienteUpdate }) =>
      ingredientApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredientes'] });
    },
  });
};

export const useDeleteIngrediente = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => ingredientApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredientes'] });
    },
  });
};
