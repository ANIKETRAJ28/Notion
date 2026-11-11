import { PoolClient } from 'pg';

import { ICreateWorkspaceMember, IWorkspaceMember } from '../schema/workspace-member.schema.js';

export class WorkspaceMemberRepository {
  async createWorkspaceMember(client: PoolClient, data: ICreateWorkspaceMember): Promise<void> {
    const query = `
      INSERT INTO workspace_members (workspace_id, user_id, role)
      VALUES ($1, $2, $3);
    `;
    const values = [data.workspace_id, data.user_id, data.role];
    await client.query(query, values);
  }

  async getWorkspaceMemberForUser(
    client: PoolClient,
    workspaceId: string,
    userId: string,
  ): Promise<IWorkspaceMember | null> {
    const query = `
      SELECT *
      FROM workspace_members
      WHERE workspace_id = $1
        AND user_id = $2;
    `;
    const values = [workspaceId, userId];
    const result = await client.query(query, values);
    const workspaceMember: IWorkspaceMember | null = result.rows[0] ?? null;
    return workspaceMember;
  }
}
