import { NextFunction, Request, Response } from 'express';

import { createWorkspaceSchema, IWorkspace, IWorkspaceWithMember } from '../schema/workspace.schema.js';
import { WorkspaceService } from '../service/workspace.service.js';
import { AppError } from '../utils/app-error.util.js';

export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  createWorkspace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      const validation = createWorkspaceSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid workspace data',
          errors: validation.error.issues,
        });
        return;
      }
      if (validation.data.created_by !== userId) {
        res.status(400).json({
          success: false,
          message: 'Invalid workspace data',
          errors: 'User id and created by does not match',
        });
        return;
      }

      const workspaceWithMember: IWorkspaceWithMember = await this.workspaceService.createWorkspace(validation.data);

      res.status(200).json({
        success: true,
        message: 'Workspaces fetched successfully',
        data: {
          workspaceWithMember,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getUserWorkspaces = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      const workspaces: IWorkspace[] = await this.workspaceService.getUserWorkspaces(userId);

      res.status(200).json({
        success: true,
        message: 'Workspaces fetched successfully',
        data: {
          workspaces,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
