import { NextFunction, Request, Response } from 'express';

import { createPageSchema, IPage, updatePageSchema } from '../schema/page.schema.js';
import { PageService } from '../service/page.service.js';
import { AppError } from '../utils/app-error.util.js';

export class PageController {
  constructor(private readonly pageService: PageService) {}

  createPage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Authentication required', 401);
      }
      const validation = createPageSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid page creation data',
          errors: validation.error.issues,
        });
        return;
      }
      const page: IPage = await this.pageService.createPage(userId, validation.data);
      res.status(201).json({
        success: true,
        message: 'Page created successfully',
        data: { page },
      });
    } catch (error) {
      next(error);
    }
  };

  getPageById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const pageId = req.params.page_id;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }
      if (!pageId) {
        res.status(400).json({
          success: false,
          message: 'Page Id is required',
        });
        return;
      }
      if (typeof pageId !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Invalid Page Id',
        });
        return;
      }
      const page = await this.pageService.getPageByIdForUser(userId, pageId);

      res.status(200).json({
        success: true,
        message: 'Page fetched successfully',
        data: { page },
      });
    } catch (error) {
      next(error);
    }
  };

  getWorkspacePages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const workspaceId = req.params.workspace_id;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }
      if (!workspaceId) {
        res.status(400).json({
          success: false,
          message: 'Workspace Id is required',
        });
        return;
      }
      if (typeof workspaceId !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Invalid Workspace Id',
        });
        return;
      }
      const pages = await this.pageService.getPagesForWorkspace(userId, workspaceId);

      res.status(200).json({
        success: true,
        message: 'Workspace pages fetched successfully',
        data: { pages },
      });
    } catch (error) {
      next(error);
    }
  };

  updatePage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const pageId = req.params.page_id;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }
      if (!pageId) {
        res.status(400).json({
          success: false,
          message: 'Page Id is required',
        });
        return;
      }
      if (typeof pageId !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Invalid Page Id',
        });
        return;
      }

      const validation = updatePageSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid page update data',
          errors: validation.error.issues,
        });
        return;
      }
      const page = await this.pageService.updatePage(userId, pageId, validation.data);

      res.status(200).json({
        success: true,
        message: 'Page updated successfully',
        data: { page },
      });
    } catch (error) {
      next(error);
    }
  };

  deletePage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const pageId = req.params.page_id;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }
      if (!pageId) {
        res.status(400).json({
          success: false,
          message: 'Page Id is required',
        });
        return;
      }
      if (typeof pageId !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Invalid Page Id',
        });
        return;
      }
      await this.pageService.deletePage(userId, pageId);

      res.status(200).json({
        success: true,
        message: 'Page deleted successfully',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  };
}
