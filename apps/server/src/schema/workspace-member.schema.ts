import { z } from 'zod';

const roleEnum = z.enum(['owner', 'admin', 'member']);

export const createWorkspaceMemberSchema = z.object({
  workspace_id: z.string().trim(),
  user_id: z.string().trim(),
  role: roleEnum,
});

export type IMemberRole = z.infer<typeof roleEnum>;
export type ICreateWorkspaceMember = z.infer<typeof createWorkspaceMemberSchema>;
export type IWorkspaceMember = ICreateWorkspaceMember & {
  joined_at: Date;
};
