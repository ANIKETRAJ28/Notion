/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.sql(`
    CREATE TABLE sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      revoked_at TIMESTAMPTZ
    );
  `);

  pgm.sql(`
    ALTER TABLE sessions
      ADD CONSTRAINT fk_sessions_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE;
  `);

  pgm.sql(`
    CREATE INDEX idx_sessions_user_id
      ON sessions(user_id);

    CREATE INDEX idx_sessions_expires_at
      ON sessions(expires_at);
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`
    DROP INDEX
      idx_sessions_expires_at,
      idx_sessions_user_id;
  `);

  pgm.sql(`
    ALTER TABLE sessions
      DROP CONSTRAINT fk_sessions_user;
  `);

  pgm.sql(`DROP TABLE sessions;`);
};
