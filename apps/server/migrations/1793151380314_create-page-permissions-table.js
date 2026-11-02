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
    CREATE TYPE page_permission_level AS ENUM (
      'view',
      'comment',
      'edit'
    );
  `);
  pgm.sql(`
    CREATE TABLE page_permissions (
      page_id UUID NOT NULL,
      user_id UUID NOT NULL,
      permission page_permission_level NOT NULL DEFAULT 'view',
      granted_by UUID NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  pgm.sql(`
    ALTER TABLE page_permissions
      ADD CONSTRAINT pk_page_permissions
        PRIMARY KEY (page_id, user_id),

      ADD CONSTRAINT fk_page_permissions_page
        FOREIGN KEY (page_id)
        REFERENCES pages(id)
        ON DELETE CASCADE,
      
      ADD CONSTRAINT fk_page_permissions_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
      
      ADD CONSTRAINT fk_page_permission_granted_by
        FOREIGN KEY (granted_by)
        REFERENCES users(id)
        ON DELETE RESTRICT;
  `);

  pgm.sql(`
    CREATE INDEX idx_page_permissions_user_id
      ON page_permissions(user_id);
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.sql(`DROP INDEX idx_page_permissions_user_id;`);

  pgm.sql(`
    ALTER TABLE page_permissions
      DROP CONSTRAINT fk_page_permission_granted_by,
      DROP CONSTRAINT fk_page_permissions_user,
      DROP CONSTRAINT fk_page_permissions_page,
      DROP CONSTRAINT pk_page_permissions;
  `);

  pgm.sql(`DROP TABLE page_permissions;`);

  pgm.sql(`DROP TYPE page_permission_level;`);
};
