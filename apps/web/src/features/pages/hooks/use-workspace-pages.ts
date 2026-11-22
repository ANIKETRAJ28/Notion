import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/stores/auth.store';
import { useWorkspaceStore } from '@/features/workspaces/stores/workspace.store';

import { pageService } from '../services/page.service';

export function useWorkspacePages(parentPageId: string | null, enabled = true) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);

  return useQuery({
    queryKey: ['pages', 'workspace', activeWorkspaceId, parentPageId],

    queryFn: () => {
      if (!accessToken) {
        throw new Error('Authentication required');
      }
      if (!activeWorkspaceId) {
        throw new Error('Workspace id required');
      }

      return pageService.getWorkspacePages(activeWorkspaceId, parentPageId, accessToken);
    },

    enabled: Boolean(accessToken && activeWorkspaceId && enabled),

    staleTime: 1000 * 60 * 5,
  });
}
