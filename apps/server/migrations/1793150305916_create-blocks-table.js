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
    CREATE TYPE block_type AS ENUM (
      'paragraph',
      'heading_1',
      'heading_2',
      'heading_3',
      'bulleted_list_item',
      'numbered_list_item',
      'todo',
      'code',
      'quote',
      'divider',
      'image',
      'callout'
    );
  `);

  pgm.sql(`
    CREATE TABLE blocks (
      id UUID PRIMARY KEY default gen_random_UUID(),
      page_id UUID NOT NULL,
      parent_block_id UUID,
      type block_type NOT NULL DEFAULT 'paragraph',
      content JSONB NOT NULL DEFAULT '{}'::jsonb,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  pgm.sql(`
    ALTER TABLE blocks
    ADD CONSTRAINT uk_blocks_id_page
      UNIQUE (id, page_id),
    
      ADD CONSTRAINT fk_blocks_page
      FOREIGN KEY (page_id)
      REFERENCES pages(id)
      ON DELETE CASCADE,
    
    ADD CONSTRAINT fk_blocks_parent_block
      FOREIGN KEY (parent_block_id)
      REFERENCES blocks(id)
      ON DELETE CASCADE,

    ADD CONSTRAINT fk_blocks_parent_same_page
      FOREIGN KEY (parent_block_id, page_id)
      REFERENCES blocks (id, page_id),
      
    ADD CONSTRAINT ck_block_no_self_parent
      CHECK (parent_block_id IS NULL or parent_block_id <> id),
    
    ADD CONSTRAINT ck_block_position_nonnegative
      CHECK (position >= 0);
    
  `);

  pgm.sql(`
    CREATE INDEX idx_blocks_page_id
      ON blocks(page_id);

    CREATE INDEX idx_blocks_parent_block_id
      ON blocks(parent_block_id);

    CREATE INDEX idx_blocks_page_position_idx
      ON blocks(page_id, position);
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
      idx_blocks_page_position_idx,
      idx_blocks_parent_block_id,
      idx_blocks_page_id;
  `);

  pgm.sql(`
    ALTER TABLE blocks
    DROP CONSTRAINT ck_block_position_nonnegative,
    DROP CONSTRAINT ck_block_no_self_parent,
    DROP CONSTRAINT fk_blocks_parent_same_page,
    DROP CONSTRAINT fk_blocks_parent_block,
    DROP CONSTRAINT fk_blocks_page,
    DROP CONSTRAINT uk_blocks_id_page;
  `);

  pgm.sql(`DROP TABLE blocks;`);

  pgm.sql(`DROP TYPE block_type;`);
};
