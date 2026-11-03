import pg from 'pg';

import { DATABASE_URL } from './env.config.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: DATABASE_URL, // PostgreSQL connection URL
  max: 10, // Maximum 10 simultaneous connections in this pool
  idleTimeoutMillis: 30000, // 	Closes idle connections after 30 seconds
  connectionTimeoutMillis: 2000, // Waits up to 2 seconds to establish a connection
});
