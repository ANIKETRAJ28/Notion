import { Pool } from 'pg';

import { PageRepository } from '../repository/page.repository.js';
import { PagePermissionRepository } from '../repository/page-permission.repository.js';
import { WorkspaceMemberRepository } from '../repository/workspace-member.repository.js';
import { IPagePermission, IPagePermissionEnum } from '../schema/page-permission.schema.js';
import { AppError } from '../utils/app-error.util.js';

export class PagePermissionService {
  constructor(
    private readonly pageRepository: PageRepository,
    private readonly pagePermissionRepository: PagePermissionRepository,
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,
    private readonly clientPool: Pool,
  ) {}

  async getPagePermissions(requestedBy: string, pageId: string): Promise<IPagePermission[]> {
    const client = await this.clientPool.connect();
    try {
      const page = await this.pageRepository.getPageById(client, pageId);
      if (!page) {
        throw new AppError('Page not found', 404);
      }
      const membership = await this.workspaceMemberRepository.getWorkspaceMember(
        client,
        page.workspace_id,
        requestedBy,
      );
      if (!membership) {
        throw new AppError('You do not have access to this page', 403);
      }
      if (membership.role !== 'owner' && membership.role !== 'admin') {
        throw new AppError('Only workspace owners and admins can view page permissions', 403);
      }
      return await this.pagePermissionRepository.getPagePermissions(client, pageId);
    } finally {
      client.release();
    }
  }

  async grantPagePermission(
    grantedBy: string,
    pageId: string,
    userId: string,
    permission: IPagePermissionEnum,
  ): Promise<IPagePermission> {
    const client = await this.clientPool.connect();
    try {
      const page = await this.pageRepository.getPageById(client, pageId);
      if (!page) {
        throw new AppError('Page not found', 404);
      }
      const grantorMembership = await this.workspaceMemberRepository.getWorkspaceMember(
        client,
        page.workspace_id,
        grantedBy,
      );
      if (!grantorMembership) {
        throw new AppError('You do not have access to this page', 403);
      }
      if (grantorMembership.role !== 'owner' && grantorMembership.role !== 'admin') {
        throw new AppError('Only workspace owners and admins can share pages', 403);
      }
      const targetMembership = await this.workspaceMemberRepository.getWorkspaceMember(
        client,
        page.workspace_id,
        userId,
      );
      if (!targetMembership) {
        throw new AppError('The user must be a member of this workspace', 400);
      }
      const existingPermission = await this.pagePermissionRepository.getPagePermissionForUser(client, pageId, userId);
      if (existingPermission) {
        throw new AppError('This user already has permission on this page', 409);
      }
      return await this.pagePermissionRepository.createPagePermission(client, {
        page_id: pageId,
        user_id: userId,
        permission,
        granted_by: grantedBy,
      });
    } finally {
      client.release();
    }
  }

  async updatePagePermission(
    updatedBy: string,
    pageId: string,
    userId: string,
    permission: IPagePermissionEnum,
  ): Promise<IPagePermission> {
    const client = await this.clientPool.connect();
    try {
      const page = await this.pageRepository.getPageById(client, pageId);
      if (!page) {
        throw new AppError('Page not found', 404);
      }
      const membership = await this.workspaceMemberRepository.getWorkspaceMember(client, page.workspace_id, updatedBy);
      if (!membership) {
        throw new AppError('You do not have access to this page', 403);
      }
      if (membership.role !== 'owner' && membership.role !== 'admin') {
        throw new AppError('Only workspace owners and admins can update page permissions', 403);
      }
      const existingPermission = await this.pagePermissionRepository.getPagePermissionForUser(client, pageId, userId);
      if (!existingPermission) {
        throw new AppError('Page permission not found', 404);
      }
      const updatedPermission = await this.pagePermissionRepository.updatePagePermission(
        client,
        pageId,
        userId,
        permission,
      );
      if (!updatedPermission) {
        throw new AppError('Page permission not found', 404);
      }
      return updatedPermission;
    } finally {
      client.release();
    }
  }

  async revokePagePermission(revokedBy: string, pageId: string, userId: string): Promise<void> {
    const client = await this.clientPool.connect();
    try {
      const page = await this.pageRepository.getPageById(client, pageId);
      if (!page) {
        throw new AppError('Page not found', 404);
      }
      const membership = await this.workspaceMemberRepository.getWorkspaceMember(client, page.workspace_id, revokedBy);
      if (!membership) {
        throw new AppError('You do not have access to this page', 403);
      }
      if (membership.role !== 'owner' && membership.role !== 'admin') {
        throw new AppError('Only workspace owners and admins can revoke page permissions', 403);
      }
      const isDeleted = await this.pagePermissionRepository.deletePagePermission(client, pageId, userId);
      if (!isDeleted) {
        throw new AppError('Page permission not found', 404);
      }
    } finally {
      client.release();
    }
  }
}
