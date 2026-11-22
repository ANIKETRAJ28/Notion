import { useMutation, useQueryClient } from '@tanstack/react-query';

import { authService } from '../services/auth.service';
import { useAuthStore } from '../stores/auth.store';

export function useLogin() {
  return useMutation({
    mutationFn: authService.login,

    onSuccess: ({ data }) => {
      useAuthStore.getState().setAuth(data.user, data.accessToken);
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: authService.register,

    onSuccess: ({ data }) => {
      useAuthStore.getState().setAuth(data.user, data.accessToken);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.logout,

    onSettled: () => {
      useAuthStore.getState().clearAuth();
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== 'auth' || query.queryKey[1] !== 'initialization',
      });
    },
  });
}
