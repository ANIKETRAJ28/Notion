import { z } from 'zod';

export const createPageSchema = z.object({
  workspace_id: z.string().trim(),
  parent_page_id: z.string().trim().nullable().optional(),
  created_by: z.string().trim(),
  title: z.string().trim(),
  icon: z.string().trim().nullable().optional(),
  cover_url: z.url().nullable().optional(),
});

export const updatePageSchema = z.object({
  parent_page_id: z.string().trim().nullable().optional(),
  title: z.string().trim().optional(),
  icon: z.string().trim().nullable().optional(),
  cover_url: z.url().nullable().optional(),
});

export type ICreatePage = z.infer<typeof createPageSchema>;

export interface IPage {
  id: string;
  workspace_id: string;
  parent_page_id: string | null;
  created_by: string;
  title: string;
  icon: string | null;
  cover_url: string | null;
  is_archived: boolean;
  created_at: Date;
  updated_at: Date;
}

export type IUpdatePage = z.infer<typeof updatePageSchema>;

export interface IPageTree extends IPage {
  children: IPageTree[];
}
