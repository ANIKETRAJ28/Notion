import { PoolClient } from 'pg';

import { ICreatePage, IPage, IUpdatePage } from '../schema/page.schema.js';

export class PageRepository {
  async createPage(client: PoolClient, data: ICreatePage): Promise<IPage> {
    const query = `
      INSERT INTO pages (
        workspace_id,
        parent_page_id,
        created_by,
        title,
        icon,
        cover_url
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      data.workspace_id,
      data.parent_page_id ?? null,
      data.created_by,
      data.title,
      data.icon ?? null,
      data.cover_url ?? null,
    ];

    const result = await client.query(query, values);
    const page: IPage = result.rows[0];
    return page;
  }

  async getPageById(client: PoolClient, pageId: string): Promise<IPage | null> {
    const query = `
      SELECT *
      FROM pages
        WHERE id = $1;
    `;
    const values = [pageId];
    const result = await client.query(query, values);
    const page: IPage | null = result.rows[0] ?? null;
    return page;
  }

  async getWorkspacePages(client: PoolClient, workspaceId: string): Promise<IPage[]> {
    const query = `
      SELECT *
      FROM pages
        WHERE workspace_id = $1
      ORDER BY created_at ASC;
    `;
    const values = [workspaceId];
    const result = await client.query(query, values);
    const pages: IPage[] = result.rows;
    return pages;
  }

  async getWorkspacePagesWithParentPageId(
    client: PoolClient,
    workspaceId: string,
    parentPageId: string | null,
  ): Promise<IPage[]> {
    let query = `
      SELECT *
      FROM pages
        WHERE workspace_id = $1
    `;
    if (!parentPageId) {
      query += ' AND parent_page_id IS null';
    } else {
      query += ' AND parent_page_id = $2';
    }
    query += ' ORDER BY created_at ASC;';

    const values = [workspaceId];
    if (parentPageId) {
      values.push(parentPageId);
    }
    const result = await client.query(query, values);
    const pages: IPage[] = result.rows;
    return pages;
  }

  // async getPageAnsistorsForWorkspace(client: PoolClient, workspaceId: string, pageId: string): Promise<IPage[]> {
  //   const query = `
  //     WITH RECCURSIVE page_chain AS (
  //       SELECT *, ARRAY[id] AS path FROM pages
  //         WHERE id = $1
  //           AND workspace_id = $2

  //         UNION

  //       SELECT parent.* FROM pages parent
  //       INNER JOIN page_chain child
  //         ON child.parnet_page_id = parent.id
  //       WHERE NOT parent.id = ANY(child.path)
  //     )

  //     SELECT * FROM page_chain;
  //   `;

  //   const values = [pageId, workspaceId];
  //   const result = await client.query(query, values);
  //   const pages: IPage[] = result.rows;
  //   return pages;
  // }

  async updatePage(client: PoolClient, pageId: string, data: IUpdatePage): Promise<IPage | null> {
    const updates: string[] = [];
    const values: (string | null)[] = [];

    if (data.title !== undefined) {
      values.push(data.title);
      updates.push(`title = $${values.length}`);
    }

    if (data.icon !== undefined) {
      values.push(data.icon);
      updates.push(`icon = $${values.length}`);
    }

    if (data.cover_url !== undefined) {
      values.push(data.cover_url);
      updates.push(`cover_url = $${values.length}`);
    }

    if (data.parent_page_id !== undefined) {
      values.push(data.parent_page_id);
      updates.push(`parent_page_id = $${values.length}`);
    }

    if (updates.length === 0) {
      return this.getPageById(client, pageId);
    }

    updates.push('updated_at = NOW()');
    values.push(pageId);

    const query = `
      UPDATE pages
      SET ${updates.join(', ')}
        WHERE id = $${values.length}
      RETURNING *;
    `;
    const result = await client.query(query, values);
    const page: IPage | null = result.rows[0] ?? null;
    return page;
  }

  async deletePage(client: PoolClient, pageId: string): Promise<boolean> {
    const query = `
      DELETE FROM pages
        WHERE id = $1;
    `;
    const values = [pageId];
    const result = await client.query(query, values);
    return result.rowCount === 1;
  }

  async hasChildPagesForPage(client: PoolClient, pageId: string): Promise<boolean> {
    const query = `
      SELECT EXISTS (
        SELECT 1
        FROM pages
        WHERE parent_page_id = $1
      ) AS has_children;
    `;
    const values = [pageId];
    const result = await client.query(query, values);
    return result.rows[0].has_children;
  }
}
