import type { PoolClient } from 'pg';

import { IRegisterUser, IUser, IUserWithPassword } from '../schema/auth.schema.js';

export class UserRepository {
  async createUser(client: PoolClient, data: IRegisterUser): Promise<IUser> {
    const query = `
        INSERT INTO users (name, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, name, email, created_at, updated_at;
      `;
    const values = [data.name, data.email, data.password];
    const result = await client.query(query, values);
    const user: IUser = result.rows[0];
    return user;
  }

  async findUserByEmail(client: PoolClient, email: string): Promise<IUserWithPassword | null> {
    const query = `
      SELECT * FROM users
      WHERE email = $1;
    `;
    const values = [email];
    const result = await client.query(query, values);
    if (result.rows.length === 0) {
      return null;
    }
    const user: IUserWithPassword = result.rows[0];
    return user;
  }
}
