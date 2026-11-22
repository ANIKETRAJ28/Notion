import { z } from 'zod';

const blockTypeEnum = z.enum([
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
  'callout',
]);

export const createBlockSchema = z.object({
  page_id: z.string().trim(),
  parent_block_id: z.string().trim(),
  type: blockTypeEnum.default('paragraph'),
  content: z.object().default({}),
  position: z.number().nonnegative().default(0),
});

export const updateBlockSchema = z.object({
  parent_block_id: z.string().trim().nullable().optional(),
  type: blockTypeEnum.optional(),
  content: z.record(z.string(), z.unknown()).optional(),
  position: z.number().int().nonnegative().optional(),
});

export type IBlockType = z.infer<typeof blockTypeEnum>;

export type ICreateBlock = z.infer<typeof createBlockSchema>;

export type IUpdateBlock = z.infer<typeof updateBlockSchema>;

export type IBlock = ICreateBlock & {
  id: string;
  created_at: Date;
  updated_at: Date;
};
