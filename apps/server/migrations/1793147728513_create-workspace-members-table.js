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
    CREATE TYPE workspace_role AS ENUM (
      'owner',
      'admin',
      'member'
    );
  `);

  pgm.sql(`
    CREATE TABLE workspace_members (
      workspace_id UUID NOT NULL,
      user_id UUID NOT NULL,
      role workspace_role NOT NULL DEFAULT 'member',
      joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  pgm.sql(`
    ALTER TABLE workspace_members
      ADD CONSTRAINT pk_workspace_members
        PRIMARY KEY (workspace_id, user_id),
      
      ADD CONSTRAINT fk_workspace_members_workspace
        FOREIGN KEY (workspace_id)
        REFERENCES workspaces(id)
        ON DELETE CASCADE,

      ADD CONSTRAINT fk_workspace_members_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE;
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`
    ALTER TABLE workspace_members
      DROP CONSTRAINT fk_workspace_members_user,
      DROP CONSTRAINT fk_workspace_members_workspace,
      DROP CONSTRAINT pk_workspace_members;
  `);

  pgm.sql(`DROP TABLE workspace_members;`);

  pgm.sql(`DROP TYPE workspace_role;`);
};
