import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

import { pagePermissionEnum } from '../schema/page-permission.schema.js';
import { PagePermissionService } from '../service/page-permission.service.js';
import { AppError } from '../utils/app-error.util.js';

export class PagePermissionController {
  constructor(private readonly pagePermissionService: PagePermissionService) {}

  grantPagePermission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const grantedBy = req.user?.id;
      const pageId = req.params.page_id;

      if (!grantedBy) {
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

      const validation = z.object({ user_id: z.string().trim(), permission: pagePermissionEnum }).safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid page permission data',
          errors: validation.error.issues,
        });
        return;
      }

      const pagePermission = await this.pagePermissionService.grantPagePermission(
        grantedBy,
        pageId,
        validation.data.user_id,
        validation.data.permission,
      );

      res.status(201).json({
        success: true,
        message: 'Page permission granted successfully',
        data: { pagePermission },
      });
    } catch (error) {
      next(error);
    }
  };

  getPagePermissionsForPage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      const pagePermissions = await this.pagePermissionService.getPagePermissionsForPage(userId, pageId);

      res.status(200).json({
        success: true,
        message: 'Page permissions fetched successfully',
        data: { pagePermissions },
      });
    } catch (error) {
      next(error);
    }
  };

  updatePagePermission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const updatedBy = req.user?.id;
      const pageId = req.params.page_id;
      const userId = req.params.user_id;

      if (!updatedBy) {
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
      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User Id is required',
        });
        return;
      }

      if (typeof userId !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Invalid User Id',
        });
        return;
      }

      const validation = z.object({ permission: pagePermissionEnum }).safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid page permission data',
          errors: validation.error.issues,
        });
        return;
      }

      const pagePermission = await this.pagePermissionService.updatePagePermission(
        updatedBy,
        pageId,
        userId,
        validation.data.permission,
      );

      res.status(200).json({
        success: true,
        message: 'Page permission updated successfully',
        data: { pagePermission },
      });
    } catch (error) {
      next(error);
    }
  };

  revokePagePermission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const revokedBy = req.user?.id;
      const pageId = req.params.page_id;
      const userId = req.params.user_id;

      if (!revokedBy) {
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

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User Id is required',
        });
        return;
      }

      if (typeof userId !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Invalid User Id',
        });
        return;
      }

      await this.pagePermissionService.revokePagePermission(revokedBy, pageId, userId);

      res.status(200).json({
        success: true,
        message: 'Page permission revoked successfully',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  };
}
