import type { QueryResult, QueryResultRow } from 'pg';

import { pool } from '../config/database.config.js';

export const query = async <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> => {
  return pool.query<T>(text, params);
};
