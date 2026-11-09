import { PoolClient } from 'pg';

import { ICreateWorkspaceMember } from '../schema/workspace-member.schema.js';

export class WorkspaceMemberRepository {
  async createWorkspaceMember(client: PoolClient, data: ICreateWorkspaceMember): Promise<void> {
    const query = `
      INSERT INTO workspace_members (workspace_id, user_id, role)
      VALUES ($1, $2, $3);
    `;
    const values = [data.workspace_id, data.user_id, data.role];
    await client.query(query, values);
  }
}
