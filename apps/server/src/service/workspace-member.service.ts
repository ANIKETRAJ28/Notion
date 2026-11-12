import { Pool } from 'pg';

import { WorkspaceMemberRepository } from '../repository/workspace-member.repository.js';
import { ICreateWorkspaceMember } from '../schema/workspace-member.schema.js';
import { AppError } from '../utils/app-error.util.js';

export class WorkspaceMemberService {
  constructor(
    private readonly workspaceMemberRepository: WorkspaceMemberRepository,
    private readonly clientPool: Pool,
  ) {}

  async createWorkspaceMember(workspaceMember: string, data: ICreateWorkspaceMember): Promise<void> {
    const client = await this.clientPool.connect();
    try {
      const authorizedWorkspaceMember = await this.workspaceMemberRepository.getWorkspaceMemberForUser(
        client,
        data.workspace_id,
        workspaceMember,
      );
      if (!authorizedWorkspaceMember) {
        throw new AppError('You are not member of workspace', 401);
      }
      if (authorizedWorkspaceMember.role !== 'owner' && authorizedWorkspaceMember.role !== 'admin') {
        throw new AppError('You are not authorized to add member to workspace', 401);
      }
      const userWorkspaceMember = await this.workspaceMemberRepository.getWorkspaceMemberForUser(
        client,
        data.workspace_id,
        data.user_id,
      );
      if (userWorkspaceMember) {
        throw new AppError('User already a member of workspace', 400);
      }
      await this.workspaceMemberRepository.createWorkspaceMember(client, data);
    } finally {
      client.release();
    }
  }
}
