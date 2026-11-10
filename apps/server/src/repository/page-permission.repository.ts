import { PoolClient } from 'pg';

import { ICreatePagePermission, IPagePermission, IPagePermissionEnum } from '../schema/page-permission.schema.js';

export class PagePermissionRepository {
  async createPagePermission(client: PoolClient, data: ICreatePagePermission): Promise<IPagePermission> {
    const query = `
      INSERT INTO page_permissions (
        page_id,
        user_id,
        permission,
        granted_by
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [data.page_id, data.user_id, data.permission, data.granted_by];
    const result = await client.query(query, values);
    const pagePermission: IPagePermission = result.rows[0];
    return pagePermission;
  }

  async getPagePermissionForUser(client: PoolClient, pageId: string, userId: string): Promise<IPagePermission | null> {
    const query = `
      SELECT *
      FROM page_permissions
        WHERE page_id = $1
        AND user_id = $2;
    `;
    const result = await client.query<IPagePermission>(query, [pageId, userId]);
    const pagePermission = result.rows[0] ?? null;
    return pagePermission;
  }

  async getPagePermissions(client: PoolClient, pageId: string): Promise<IPagePermission[]> {
    const query = `
    SELECT *
    FROM page_permissions
    WHERE page_id = $1
    ORDER BY created_at ASC;
  `;
    const result = await client.query<IPagePermission>(query, [pageId]);
    return result.rows;
  }

  async getWorkspacePagePermissions(
    client: PoolClient,
    workspaceId: string,
    userId: string,
  ): Promise<IPagePermission[]> {
    const query = `
      SELECT pp.*
      FROM page_permissions pp
      INNER JOIN pages p
        ON p.id = pp.page_id
      WHERE p.workspace_id = $1
        AND pp.user_id = $2
      ORDER BY pp.created_at ASC;
    `;
    const values = [workspaceId, userId];
    const result = await client.query(query, values);
    const pagePermissions: IPagePermission[] = result.rows;
    return pagePermissions;
  }

  async getUserPagePermissions(client: PoolClient, userId: string): Promise<IPagePermission[]> {
    const query = `
      SELECT *
      FROM page_permissions
        WHERE user_id = $1
      ORDER BY created_at ASC;
    `;
    const values = [userId];
    const result = await client.query(query, values);
    const pagePermissions: IPagePermission[] = result.rows;
    return pagePermissions;
  }

  async updatePagePermission(
    client: PoolClient,
    pageId: string,
    userId: string,
    permission: IPagePermissionEnum,
  ): Promise<IPagePermission | null> {
    const query = `
      UPDATE page_permissions
      SET permission = $1
      WHERE page_id = $2
        AND user_id = $3
      RETURNING *;
    `;
    const values = [permission, pageId, userId];
    const result = await client.query(query, values);
    const pagePermission: IPagePermission | null = result.rows[0] ?? null;
    return pagePermission;
  }

  async deletePagePermission(client: PoolClient, pageId: string, userId: string): Promise<boolean> {
    const query = `
    DELETE FROM page_permissions
      WHERE page_id = $1
        AND user_id = $2;
    `;
    const values = [pageId, userId];
    const result = await client.query(query, values);
    return result.rowCount === 1;
  }

  async deleteWorkspaceUserPagePermissions(client: PoolClient, workspaceId: string, userId: string): Promise<void> {
    const query = `
    DELETE FROM page_permissions pp
      USING pages p
      WHERE pp.page_id = p.id
        AND p.workspace_id = $1
        AND pp.user_id = $2;
    `;
    const values = [workspaceId, userId];
    await client.query(query, values);
  }
}
