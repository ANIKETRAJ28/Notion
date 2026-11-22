import { Pool, PoolClient } from 'pg';

import { BlockRepository } from '../repository/block.repository.js';
import { PageRepository } from '../repository/page.repository.js';
import { PagePermissionRepository } from '../repository/page-permission.repository.js';
import { WorkspaceMemberRepository } from '../repository/workspace-member.repository.js';
import { IBlock, ICreateBlock, IUpdateBlock } from '../schema/block.schema.js';
import { IPagePermissionEnum } from '../schema/page-permission.schema.js';
import { AppError } from '../utils/app-error.util.js';

export class BlockService {
  constructor(
    private readonly blockRepository: BlockRepository,
    private readonly pagePermissionRepository: PagePermissionRepository,
    private readonly pageRepository: PageRepository,
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,
    private readonly pool: Pool,
  ) {}

  private async checkPagePermissionForUser(
    client: PoolClient,
    userId: string,
    pageId: string,
    requiredPermission: IPagePermissionEnum,
  ): Promise<void> {
    const page = await this.pageRepository.getPageById(client, pageId);

    if (!page) {
      throw new AppError('Page not found', 404);
    }

    const membership = await this.workspaceMemberRepository.getWorkspaceMemberForUser(
      client,
      page.workspace_id,
      userId,
    );
    if (!membership) {
      throw new AppError('You do not have access to this page', 403);
    }
    if (page.created_by === userId) {
      return;
    }
    if (membership.role === 'owner' || membership.role === 'admin') {
      return;
    }
    const permission = await this.pagePermissionRepository.getPagePermissionForUserForPage(client, page.id, userId);
    const permissionHierarchy: Record<IPagePermissionEnum, number> = {
      view: 1,
      comment: 2,
      edit: 3,
    };
    if (!permission || permissionHierarchy[permission.permission] < permissionHierarchy[requiredPermission]) {
      throw new AppError('You do not have sufficient permission', 403);
    }
  }

  private async hasCircularHierarchy(client: PoolClient, blockId: string, parentBlockId: string): Promise<boolean> {
    let currentParentId: string | null = parentBlockId;

    while (currentParentId) {
      if (currentParentId === blockId) {
        return true;
      }

      const parent = await this.blockRepository.getBlockById(client, currentParentId);

      currentParentId = parent?.parent_block_id ?? null;
    }
    return false;
  }

  async getBlocksForPage(userId: string, pageId: string): Promise<IBlock[]> {
    const client = await this.pool.connect();
    try {
      await this.checkPagePermissionForUser(client, userId, pageId, 'view');

      return await this.blockRepository.getBlocksByPage(client, pageId);
    } finally {
      client.release();
    }
  }

  async getBlockById(userId: string, blockId: string): Promise<IBlock> {
    const client = await this.pool.connect();
    try {
      const block = await this.blockRepository.getBlockById(client, blockId);

      if (!block) {
        throw new AppError('Block not found', 400);
      }

      await this.checkPagePermissionForUser(client, userId, block.page_id, 'view');
      return block;
    } finally {
      client.release();
    }
  }

  async createBlock(userId: string, data: ICreateBlock): Promise<IBlock> {
    const client = await this.pool.connect();
    try {
      const page = await this.pageRepository.getPageById(client, data.page_id);

      if (!page) {
        throw new AppError('Page not found', 404);
      }

      this.checkPagePermissionForUser(client, userId, page.id, 'edit');

      if (data.parent_block_id) {
        const parentBlock = await this.blockRepository.getBlockById(client, data.parent_block_id);
        if (!parentBlock) {
          throw new AppError('Parent block not found', 404);
        }
      }

      return await this.blockRepository.createBlock(client, data);
    } finally {
      client.release();
    }
  }

  async updateBlock(userId: string, blockId: string, data: IUpdateBlock): Promise<IBlock> {
    const client = await this.pool.connect();
    try {
      const block = await this.blockRepository.getBlockById(client, blockId);

      if (!block) {
        throw new AppError('Block not found', 404);
      }

      if (data.parent_block_id) {
        const parentBlock = await this.blockRepository.getBlockById(client, data.parent_block_id);
        if (!parentBlock) {
          throw new AppError('Parent block not found', 404);
        }
        const hasHierarchy = await this.hasCircularHierarchy(client, block.id, data.parent_block_id);
        if (hasHierarchy) {
          throw new AppError('A block cannot be nested inside itself or its descendants', 400);
        }
      }

      const updatedBlock = await this.blockRepository.updateBlock(client, block.id, data);

      if (!updatedBlock) {
        throw new AppError('Block not found', 404);
      }

      return updatedBlock;
    } finally {
      client.release();
    }
  }

  async deleteBlock(userId: string, blockId: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      const block = await this.blockRepository.getBlockById(client, blockId);

      if (!block) {
        throw new AppError('Block not found', 404);
      }

      const page = await this.pageRepository.getPageById(client, block.page_id);

      if (!page) {
        throw new AppError('Page not found', 404);
      }

      await this.checkPagePermissionForUser(client, userId, page.id, 'edit');

      const deleted = await this.blockRepository.deleteBlock(client, block.id);

      if (!deleted) {
        throw new AppError('Block not found', 404);
      }
    } finally {
      client.release();
    }
  }
}
