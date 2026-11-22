import { apiRequest } from '@/lib/api-client';

import type { CreatePageInput, GetWorkspacePagesResponse, PageResponse } from '../types/page.types';

export const pageService = {
  async getWorkspacePages(workspaceId: string, parentPageId: string | null, accessToken: string) {
    const endpoint = parentPageId
      ? `/pages/workspaces/${workspaceId}/${parentPageId}`
      : `/pages/workspaces/${workspaceId}`;

    return apiRequest<GetWorkspacePagesResponse>(endpoint, {
      method: 'GET',
      accessToken,
    });
  },

  async getPageById(pageId: string, accessToken: string) {
    return apiRequest<PageResponse>(`/pages/${pageId}`, {
      method: 'GET',
      accessToken,
    });
  },

  async createPage(input: CreatePageInput, accessToken: string) {
    return apiRequest<PageResponse>('/pages', {
      method: 'POST',
      body: JSON.stringify(input),
      accessToken,
    });
  },
};
