import type { PoolClient } from 'pg';

import { ICreateWorkspace, IWorkspace } from '../schema/workspace.schema.js';

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
}
