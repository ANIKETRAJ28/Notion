import { z } from 'zod';

const pagePermissionEnum = z.enum(['view', 'comment', 'edit']);

export const createPagePermissionSchema = z.object({
  page_id: z.string().trim(),
  user_id: z.string().trim(),
  permission: pagePermissionEnum,
  granted_by: z.string().trim(),
});

export type IPagePermissionEnum = z.infer<typeof pagePermissionEnum>;

export type ICreatePagePermission = z.infer<typeof createPagePermissionSchema>;

export interface IPagePermission {
  page_id: string;
  user_id: string;
  permission: IPagePermissionEnum;
  granted_by: string;
  created_at: Date;
}
