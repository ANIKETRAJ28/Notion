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
    CREATE TABLE workspaces (
      id UUID PRIMARY KEY DEFAULT gen_random_UUID(),
      name VARCHAR(100) NOT NULL,
      is_personal BOOLEAN NOT NULL,
      created_by UUID NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  pgm.sql(`
    ALTER TABLE workspaces
      ADD CONSTRAINT fk_workspaces_created_by
      FOREIGN KEY (created_by)
      REFERENCES users(id)
      ON DELETE RESTRICT;
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`
    ALTER TABLE workspaces
    DROP CONSTRAINT fk_workspaces_created_by;
  `);

  pgm.sql(`DROP TABLE workspaces;`);
};
