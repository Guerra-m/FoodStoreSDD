import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi, ClientePerfilUpdate } from '../api/customerApi';

export const useCustomerProfile = () => {
  return useQuery({
    queryKey: ['customerProfile'],
    queryFn: () => customerApi.getProfile(),
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ClientePerfilUpdate) => customerApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerProfile'] });
    },
  });
};
