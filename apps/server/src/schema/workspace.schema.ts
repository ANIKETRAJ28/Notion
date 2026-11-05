import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(100),
  is_personal: z.boolean(),
  created_by: z.string().trim(),
});

export type ICreateWorkspace = z.infer<typeof createWorkspaceSchema>;

export interface IWorkspace {
  id: string;
  name: string;
  is_personal: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}
