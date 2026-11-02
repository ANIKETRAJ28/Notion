import { pool } from "../config/database.config.js";
import type { QueryResult, QueryResultRow } from "pg";

export const query = async <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> => {
  return pool.query<T>(text, params);
};
