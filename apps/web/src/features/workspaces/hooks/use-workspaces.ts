import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/stores/auth.store';

import { workspaceService } from '../services/worksapce.service';

export function useWorkspace() {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ['workspaces'],
    queryFn: () => {
      if (!accessToken) {
        throw new Error('Authentication required');
      }
      return workspaceService.getWorkspaces(accessToken);
    },
    enabled: Boolean(accessToken),
    staleTime: 1000 * 60 * 5,
  });
}
