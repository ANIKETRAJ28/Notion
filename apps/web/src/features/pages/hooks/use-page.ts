import { useQuery } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/stores/auth.store';

import { pageService } from '../services/page.service';

export function usePage(pageId: string | undefined) {
  const accessToken = useAuthStore((state) => state.accessToken);

  return useQuery({
    queryKey: ['pages', 'detail', pageId],
    queryFn: () => {
      if (!accessToken) {
        throw new Error('Authentication required');
      }

      if (!pageId) {
        throw new Error('Page Id required');
      }

      return pageService.getPageById(pageId, accessToken);
    },
    enabled: Boolean(accessToken && pageId),
  });
}
