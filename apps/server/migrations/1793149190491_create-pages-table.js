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
    CREATE TABLE pages (
      id UUID PRIMARY KEY DEFAULT gen_random_UUID(),
      workspace_id UUID NOT NULL,
      parent_page_id UUID,
      created_by UUID NOT NULL,
      title VARCHAR(255) NOT NULL DEFAULT 'Untitled',
      icon TEXT,
      cover_url TEXT,
      is_archived BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  pgm.sql(`
    ALTER TABLE pages
    ADD CONSTRAINT uk_pages_id_workspace
      UNIQUE (id, workspace_id),

    ADD CONSTRAINT fk_pages_workspace
      FOREIGN KEY (workspace_id)
      REFERENCES workspaces(id)
      ON DELETE CASCADE,

    ADD CONSTRAINT fk_pages_parent_page
      FOREIGN KEY (parent_page_id)
      REFERENCES pages(id)
      ON DELETE RESTRICT,
    
    ADD CONSTRAINT fk_pages_created_by
      FOREIGN KEY (created_by)
      REFERENCES users(id)
      ON DELETE RESTRICT,
    
    ADD CONSTRAINT fk_pages_parent_same_workspace
      FOREIGN KEY (parent_page_id, workspace_id)
      REFERENCES pages (id, workspace_id),

    ADD CONSTRAINT ck_pages_no_self_parent
      CHECK (parent_page_id IS NULL or parent_page_id <> id);
      
  `);

  pgm.sql(`
    CREATE INDEX idx_pages_workspace_id
      ON pages(workspace_id);
    
    CREATE INDEX idx_pages_parent_page_id
      ON pages(parent_page_id);
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
      idx_pages_parent_page_id,
      idx_pages_workspace_id;
  `);

  pgm.sql(`
    ALTER TABLE pages
      DROP CONSTRAINT ck_pages_no_self_parent,
      DROP CONSTRAINT fk_pages_parent_same_workspace,
      DROP CONSTRAINT fk_pages_created_by,
      DROP CONSTRAINT fk_pages_parent_page,
      DROP CONSTRAINT fk_pages_workspace,
      DROP CONSTRAINT uk_pages_id_workspace;
  `);

  pgm.sql(`DROP TABLE pages;`);
};
