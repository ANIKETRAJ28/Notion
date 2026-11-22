import { Pool } from 'pg';

import { WorkspaceRepository } from '../repository/workspace.repository.js';
import { WorkspaceMemberRepository } from '../repository/workspace-member.repository.js';
import { ICreateWorkspace, IWorkspaceWithMember } from '../schema/workspace.schema.js';

export class WorkspaceService {
  constructor(
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,
    private readonly clientPool: Pool,
  ) {}

  async createWorkspace(data: ICreateWorkspace): Promise<IWorkspaceWithMember> {
    const client = await this.clientPool.connect();
    let transactionStarted = false;
    try {
      client.query('BEGIN');
      transactionStarted = true;
      const workspace = await this.workspaceRepository.createWorkspace(client, data);
      const workspaceMember = await this.workspaceMemberRepository.createWorkspaceMember(client, {
        user_id: data.created_by,
        workspace_id: workspace.id,
        role: 'owner',
      });
      client.query('COMMIT');
      transactionStarted = false;
      return {
        ...workspace,
        role: workspaceMember.role,
        joined_at: workspaceMember.joined_at,
      };
    } catch (error) {
      if (transactionStarted) {
        try {
          await client.query('ROLLBACK');
        } catch (rollBackError) {
          console.log('Transaction rollback failed: ', rollBackError);
        }
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async getUserWorkspaces(userId: string): Promise<IWorkspaceWithMember[]> {
    const client = await this.clientPool.connect();
    try {
      const workspaces = this.workspaceRepository.getUserWorkspaces(client, userId);
      return workspaces;
    } finally {
      client.release();
    }
  }
}
