import { Pool } from 'pg';

import { WorkspaceRepository } from '../repository/workspace.repository.js';
import { IWorkspaceWithMember } from '../schema/workspace.schema.js';

export class WorkspaceService {
  constructor(
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly clientPool: Pool,
  ) {}

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
