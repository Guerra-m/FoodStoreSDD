import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addressApi, DireccionCreate, DireccionUpdate } from '../api/addressApi';

export const useDirecciones = () => {
  return useQuery({
    queryKey: ['direcciones'],
    queryFn: () => addressApi.list(),
  });
};

export const useCreateDireccion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DireccionCreate) => addressApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['direcciones'] });
    },
  });
};

export const useUpdateDireccion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: DireccionUpdate }) =>
      addressApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['direcciones'] });
    },
  });
};

export const useDeleteDireccion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => addressApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['direcciones'] });
    },
  });
};

export const useSetDireccionPrincipal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => addressApi.setPrincipal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['direcciones'] });
    },
  });
};
