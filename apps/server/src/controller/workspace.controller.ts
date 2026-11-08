import { NextFunction, Request, Response } from 'express';

import { IWorkspace } from '../schema/workspace.schema.js';
import { WorkspaceService } from '../service/workspace.service.js';
import { AppError } from '../utils/app-error.util.js';

export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

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
