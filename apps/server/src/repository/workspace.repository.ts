import type { PoolClient } from 'pg';

import { ICreateWorkspace, IWorkspace, IWorkspaceWithMember } from '../schema/workspace.schema.js';

export class WorkspaceRepository {
  async createPersonalWorkspace(client: PoolClient, data: ICreateWorkspace): Promise<IWorkspace> {
    const query = `
      INSERT INTO workspaces (name, is_personal, created_by)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const values = [data.name, data.is_personal, data.created_by];
    const result = await client.query(query, values);
    const workspace: IWorkspace = result.rows[0];
    return workspace;
  }

  async getUserWorkspaces(client: PoolClient, userId: string): Promise<IWorkspaceWithMember[]> {
    const query = `
      SELECT w.*, wm.role, wm.joined_at
      FROM workspaces w
      INNER JOIN workspace_members wm
        ON w.id = wm.workspace_id
      WHERE wm.user_id = $1
      ORDER BY wm.joined_at ASC;
    `;
    const values = [userId];
    const result = await client.query(query, values);
    const workspacesWithMember: IWorkspaceWithMember[] = result.rows;
    return workspacesWithMember;
  }
}
