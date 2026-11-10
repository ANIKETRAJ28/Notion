import { Pool, PoolClient } from 'pg';

import { PageRepository } from '../repository/page.repository.js';
import { PagePermissionRepository } from '../repository/page-permission.repository.js';
import { WorkspaceMemberRepository } from '../repository/workspace-member.repository.js';
import { ICreatePage, IPage, IPageTree, IUpdatePage } from '../schema/page.schema.js';
import { IPagePermissionEnum } from '../schema/page-permission.schema.js';
import { AppError } from '../utils/app-error.util.js';

export class PageService {
  constructor(
    private readonly pageRepository: PageRepository,
    private readonly pagePermissionRepository: PagePermissionRepository,
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,
    private readonly clientPool: Pool,
  ) {}

  async createPage(userId: string, data: ICreatePage): Promise<IPage> {
    const client = await this.clientPool.connect();
    try {
      const membership = await this.workspaceMemberRepository.getWorkspaceMember(client, data.workspace_id, userId);
      if (!membership) {
        throw new AppError('You do not have access to this workspace', 403);
      }
      // Validate parent page, if provided.
      if (data.parent_page_id) {
        const parentPage = await this.pageRepository.getPageById(client, data.parent_page_id);
        if (!parentPage || parentPage.workspace_id !== data.workspace_id) {
          throw new AppError('Parent page not found in this workspace', 404);
        }
        // User must have edit permission on the parent page.
        await this.checkPagePermission(client, userId, parentPage, 'edit');
      }
      return await this.pageRepository.createPage(client, {
        ...data,
        created_by: userId,
      });
    } finally {
      client.release();
    }
  }

  async getPageById(userId: string, pageId: string): Promise<IPage> {
    const client = await this.clientPool.connect();
    try {
      const page = await this.pageRepository.getPageById(client, pageId);
      if (!page) {
        throw new AppError('Page not found', 404);
      }
      const membership = await this.workspaceMemberRepository.getWorkspaceMember(client, page.workspace_id, userId);
      if (!membership) {
        throw new AppError('You do not have access to this page', 404);
      }
      await this.checkPagePermission(client, userId, page, 'view');
      return page;
    } finally {
      client.release();
    }
  }

  async getWorkspacePages(userId: string, workspaceId: string): Promise<IPage[]> {
    const client = await this.clientPool.connect();
    try {
      const membership = await this.workspaceMemberRepository.getWorkspaceMember(client, workspaceId, userId);
      if (!membership) {
        throw new AppError('You do not have access to this workspace', 403);
      }
      const pages = await this.pageRepository.getWorkspacePages(client, workspaceId);
      if (membership.role === 'owner' || membership.role === 'admin') {
        return pages;
      }
      const userPermissions = await this.pagePermissionRepository.getWorkspacePagePermissions(
        client,
        workspaceId,
        userId,
      );
      const accessiblePageIds = new Set(userPermissions.map((permission) => permission.page_id));
      return pages.filter((page) => page.created_by === userId || accessiblePageIds.has(page.id));
    } finally {
      client.release();
    }
  }

  async getWorkspacePageTree(userId: string, workspaceId: string): Promise<IPageTree[]> {
    const pages = await this.getWorkspacePages(userId, workspaceId);

    return this.buildPageTree(pages);
  }

  async updatePage(userId: string, pageId: string, data: IUpdatePage): Promise<IPage> {
    const client = await this.clientPool.connect();
    try {
      const existingPage = await this.pageRepository.getPageById(client, pageId);
      if (!existingPage) {
        throw new AppError('Page not found', 404);
      }
      await this.checkPagePermission(client, userId, existingPage, 'edit');
      if (data.parent_page_id !== undefined && data.parent_page_id !== null) {
        if (data.parent_page_id === pageId) {
          throw new AppError('A page cannot be its own parent', 400);
        }
        const parentPage = await this.pageRepository.getPageById(client, data.parent_page_id);
        if (!parentPage || parentPage.workspace_id !== existingPage.workspace_id) {
          throw new AppError('Parent page not found in this workspace', 404);
        }
        // A user must also be allowed to edit the new parent page.
        await this.checkPagePermission(client, userId, parentPage, 'edit');
        // Prevent circular page hierarchy.
        const hasCycle = await this.hasCircularHierarchy(
          client,
          pageId,
          data.parent_page_id,
          existingPage.workspace_id,
        );
        if (hasCycle) {
          throw new AppError('Moving this page would create a circular hierarchy', 400);
        }
      }
      const updatedPage = await this.pageRepository.updatePage(client, pageId, data);
      if (!updatedPage) {
        throw new AppError('Page not found', 404);
      }
      return updatedPage;
    } finally {
      client.release();
    }
  }

  async deletePage(userId: string, pageId: string): Promise<void> {
    const client = await this.clientPool.connect();
    try {
      const existingPage = await this.pageRepository.getPageById(client, pageId);
      if (!existingPage) {
        throw new AppError('Page not found', 404);
      }
      const membership = await this.workspaceMemberRepository.getWorkspaceMember(
        client,
        existingPage.workspace_id,
        userId,
      );
      if (!membership) {
        throw new AppError('You do not have access to this page', 403);
      }
      if (membership.role !== 'owner' && membership.role !== 'admin') {
        throw new AppError('Only workspace owners and admins can delete pages', 403);
      }
      const hasChildren = await this.pageRepository.hasChildPages(client, pageId);
      if (hasChildren) {
        throw new AppError(
          'Cannot delete a page that contains child pages. Move or delete its child pages first.',
          409,
        );
      }
      const isDeleted = await this.pageRepository.deletePage(client, pageId);
      if (!isDeleted) {
        throw new AppError('Page not found', 404);
      }
    } finally {
      client.release();
    }
  }

  private async checkPagePermission(
    client: PoolClient,
    userId: string,
    page: IPage,
    requiredPermission: IPagePermissionEnum,
  ): Promise<void> {
    const membership = await this.workspaceMemberRepository.getWorkspaceMember(client, page.workspace_id, userId);
    if (!membership) {
      throw new AppError('You do not have access to this page', 403);
    }
    if (page.created_by === userId) {
      return;
    }
    if (membership.role === 'owner' || membership.role === 'admin') {
      return;
    }
    const permission = await this.pagePermissionRepository.getPagePermissionForUser(client, page.id, userId);
    const permissionHierarchy: Record<IPagePermissionEnum, number> = {
      view: 1,
      comment: 2,
      edit: 3,
    };
    if (!permission || permissionHierarchy[permission.permission] < permissionHierarchy[requiredPermission]) {
      throw new AppError('You do not have sufficient permission', 403);
    }
  }

  private async hasCircularHierarchy(
    client: PoolClient,
    pageId: string,
    newParentPageId: string,
    workspaceId: string,
  ): Promise<boolean> {
    const pages = await this.pageRepository.getWorkspacePages(client, workspaceId);
    const pageMap = new Map(pages.map((page) => [page.id, page]));
    let currentPageId: string | null = newParentPageId;
    const visited = new Set<string>();
    while (currentPageId) {
      if (currentPageId === pageId) {
        return true;
      }
      if (visited.has(currentPageId)) {
        return true;
      }
      visited.add(currentPageId);
      const currentPage = pageMap.get(currentPageId);
      if (!currentPage) {
        break;
      }
      currentPageId = currentPage.parent_page_id;
    }
    return false;
  }

  private buildPageTree(pages: IPage[]): IPageTree[] {
    const pageMap = new Map<string, IPageTree>();
    // Create a tree node for every page.
    for (const page of pages) {
      pageMap.set(page.id, {
        ...page,
        children: [],
      });
    }
    const rootPages: IPageTree[] = [];
    // Connect child pages to their parents.
    for (const page of pageMap.values()) {
      if (page.parent_page_id && pageMap.has(page.parent_page_id)) {
        const parentPage = pageMap.get(page.parent_page_id)!;
        parentPage.children.push(page);
      } else {
        rootPages.push(page);
      }
    }
    return rootPages;
  }
}
