import { NextFunction, Request, Response } from 'express';

import { createWorkspaceMemberSchema } from '../schema/workspace-member.schema.js';
import { WorkspaceMemberService } from '../service/workspace-member.service.js';
import { AppError } from '../utils/app-error.util.js';

export class WorkspaceMemberController {
  constructor(private readonly worksapceMemberService: WorkspaceMemberService) {}

  createWorkspaceMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Authentication required', 401);
      }
      const validation = createWorkspaceMemberSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid workspace member data',
          errors: validation.error.issues,
        });
        return;
      }
      await this.worksapceMemberService.createWorkspaceMember(userId, validation.data);
      res.status(201).json({
        success: true,
        message: 'Workspace Member created successfully',
        data: {},
      });
    } catch (error) {
      next(error);
    }
  };
}
