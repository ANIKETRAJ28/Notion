export const BLOCK_TYPES = [
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
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export type BlockContent = Record<string, unknown>;

export interface Block {
  id: string;
  page_id: string;
  parent_block_id: string | null;
  type: BlockType;
  content: BlockContent;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBlock {
  page_id: string;
  parent_block_id?: string | null;
  type?: BlockType;
  content?: BlockContent;
  position?: number;
}

export interface UpdateBlock {
  parent_block_id?: string | null;
  type?: BlockType;
  content?: BlockContent;
  position?: number;
}

export interface BlockTree extends Block {
  children: BlockTree[];
}

export interface BlockForPageResponse {
  success: boolean;
  message: string;
  data: {
    blocks: Block[];
  };
}

export interface BlockResponse {
  success: boolean;
  message: string;
  data: {
    block: Block;
  };
}

export interface DeleteBlockResponse {
  success: boolean;
  message: string;
  data: object;
}
