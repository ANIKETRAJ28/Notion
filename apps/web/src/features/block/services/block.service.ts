import { apiRequest } from '@/lib/api-client';

import type {
  BlockForPageResponse,
  BlockResponse,
  CreateBlock,
  DeleteBlockResponse,
  UpdateBlock,
} from '../types/block.type';

export const blockService = {
  async getBlocksForPage(pageId: string, accessToken: string) {
    return apiRequest<BlockForPageResponse>(`/blocks/page/${pageId}`, {
      method: 'GET',
      accessToken,
    });
  },

  async getBlockById(blockId: string, accessToken: string) {
    return apiRequest<BlockResponse>(`/blocks/${blockId}`, {
      method: 'GET',
      accessToken,
    });
  },

  async createBlock(data: CreateBlock, accessToken: string) {
    return apiRequest<BlockResponse>('/blocks', {
      method: 'POST',
      body: JSON.stringify(data),
      accessToken,
    });
  },

  async updateBlock(blockId: string, data: UpdateBlock, accessToken: string) {
    return apiRequest<BlockResponse>(`/blocks/${blockId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
      accessToken,
    });
  },

  async deleteBlock(blockId: string, accessToken: string) {
    return apiRequest<DeleteBlockResponse>(`/blocks/${blockId}`, {
      method: 'DELETE',
      accessToken,
    });
  },
};
