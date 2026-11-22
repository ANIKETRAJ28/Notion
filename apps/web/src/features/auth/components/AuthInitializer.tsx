import { useQuery } from '@tanstack/react-query';

import { authService } from '../services/auth.service';
import { useAuthStore } from '../stores/auth.store';

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  useQuery({
    queryKey: ['auth', 'initialization'],
    queryFn: async () => {
      try {
        const refreshResponse = await authService.refreshToken();
        const user = await authService.getCurrentUser(refreshResponse.data.accessToken);

        useAuthStore.getState().setAuth(user.data.user, refreshResponse.data.accessToken);
      } catch {
        useAuthStore.getState().clearAuth();
      } finally {
        useAuthStore.getState().setInitialized(true);
      }
      return true;
    },
    retry: false,
    staleTime: Infinity,
  });
  return children;
}
