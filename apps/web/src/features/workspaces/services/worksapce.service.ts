import { apiRequest } from '@/lib/api-client';

import type { GetWorkspacesResponse } from '../types/workspace.types';

export const workspaceService = {
  async getWorkspaces(accessToken: string) {
    return apiRequest<GetWorkspacesResponse>('/workspaces', {
      method: 'GET',
      accessToken,
    });
  },
};
