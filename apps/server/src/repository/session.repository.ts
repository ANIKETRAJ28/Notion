import { PoolClient } from 'pg';

import { ICreateSession, ISession } from '../schema/session.schema.js';

export class SessionRepository {
  async createSession(client: PoolClient, session: ICreateSession): Promise<void> {
    const query = `
      INSERT INTO sessions (id, user_id, token_hash, expires_at)
      VALUES ($1, $2, $3, $4);
    `;
    const values = [session.id, session.user_id, session.token_hash, session.expires_at];
    await client.query(query, values);
  }

  async findActiveSessionById(client: PoolClient, sessionId: string): Promise<ISession | null> {
    // FOR UPDATE is used for locking
    const query = `
      SELECT * FROM sessions
      WHERE id = $1
        AND revoked_at IS NULL
        AND expires_at > NOW()
      FOR UPDATE;
    `;
    const values = [sessionId];
    const result = await client.query<ISession>(query, values);
    return result.rows[0] ?? null;
  }

  async revokeSession(client: PoolClient, sessionId: string): Promise<boolean> {
    const query = `
      UPDATE sessions SET revoked_at = NOW()
      WHERE id = $1
        AND revoked_at IS NULL;
    `;
    const values = [sessionId];
    const result = await client.query(query, values);
    return result.rowCount === 1;
  }
}
