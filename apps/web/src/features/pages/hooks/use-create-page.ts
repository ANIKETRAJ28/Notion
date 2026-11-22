import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '@/features/auth/stores/auth.store';

import { pageService } from '../services/page.service';
import type { CreatePageInput } from '../types/page.types';

export function useCreatePage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePageInput) => {
      if (!accessToken) {
        throw new Error('Authentication required');
      }

      return pageService.createPage(input, accessToken);
    },

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['pages', 'workspace', variables.workspace_id, variables.parent_page_id],
      });
    },
  });
}
