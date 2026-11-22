import type { PoolClient } from 'pg';

import type { IBlock, ICreateBlock, IUpdateBlock } from '../schema/block.schema.js';

export class BlockRepository {
  async createBlock(client: PoolClient, data: ICreateBlock): Promise<IBlock> {
    const query = `
      INSERT INTO blocks (
        page_id,
        parent_block_id,
        type,
        content,
        position
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    const values = [data.page_id, data.parent_block_id ?? null, data.type, data.content, data.position];

    const result = await client.query(query, values);
    const block: IBlock = result.rows[0];

    return block;
  }

  async getBlockById(client: PoolClient, blockId: string): Promise<IBlock | null> {
    const query = `
      SELECT *
      FROM blocks
      WHERE id = $1;
    `;

    const values = [blockId];

    const result = await client.query(query, values);
    const block: IBlock | null = result.rows[0] ?? null;

    return block;
  }

  async getBlocksByPage(client: PoolClient, pageId: string): Promise<IBlock[]> {
    const query = `
      SELECT *
      FROM blocks
      WHERE page_id = $1
      ORDER BY position ASC, created_at ASC;
    `;

    const values = [pageId];

    const result = await client.query(query, values);
    const blocks: IBlock[] = result.rows;

    return blocks;
  }

  async getChildBlocks(client: PoolClient, pageId: string, parentBlockId: string): Promise<IBlock[]> {
    const query = `
      SELECT *
      FROM blocks
      WHERE page_id = $1
        AND parent_block_id = $2
      ORDER BY position ASC, created_at ASC;
    `;

    const values = [pageId, parentBlockId];

    const result = await client.query(query, values);
    const blocks: IBlock[] = result.rows;

    return blocks;
  }

  async updateBlock(client: PoolClient, blockId: string, data: IUpdateBlock): Promise<IBlock | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    const allowedFields: (keyof IUpdateBlock)[] = ['parent_block_id', 'type', 'content', 'position'];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        values.push(data[field]);
        fields.push(`${field} = $${values.length}`);
      }
    }

    if (fields.length === 0) {
      return this.getBlockById(client, blockId);
    }

    values.push(blockId);

    const query = `
      UPDATE blocks
      SET ${fields.join(', ')},
          updated_at = NOW()
      WHERE id = $${values.length}
      RETURNING *;
    `;

    const result = await client.query(query, values);
    const block: IBlock | null = result.rows[0] ?? null;

    return block;
  }

  async deleteBlock(client: PoolClient, blockId: string): Promise<boolean> {
    const query = `
      DELETE FROM blocks
      WHERE id = $1;
    `;

    const values = [blockId];

    const result = await client.query(query, values);

    return result.rowCount === 1;
  }
}
