import { NextFunction, Request, Response } from 'express';

import { createBlockSchema, IBlock, updateBlockSchema } from '../schema/block.schema.js';
import { BlockService } from '../service/block.service.js';
import { AppError } from '../utils/app-error.util.js';

export class BlockController {
  constructor(private readonly blockService: BlockService) {}

  getBlockForPage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      const blocks: IBlock[] = await this.blockService.getBlocksForPage(userId, pageId);
      res.status(201).json({
        success: true,
        message: 'Blocks fetched successfully',
        data: { blocks },
      });
    } catch (error) {
      next(error);
    }
  };

  getBlockById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const blockId = req.params.block_id;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!blockId) {
        res.status(400).json({
          success: false,
          message: 'Page Id is required',
        });
        return;
      }

      if (typeof blockId !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Invalid Block Id',
        });
        return;
      }

      const block: IBlock = await this.blockService.getBlockById(userId, blockId);

      res.status(200).json({
        success: true,
        message: 'Block fetched successfully',
        data: { block },
      });
    } catch (error) {
      next(error);
    }
  };

  createBlock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      const validation = createBlockSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid block creation data',
          errors: validation.error.issues,
        });
        return;
      }

      const block = await this.blockService.createBlock(userId, validation.data);

      res.status(201).json({
        success: true,
        message: 'Block created successfully',
        data: { block },
      });
    } catch (error) {
      next(error);
    }
  };

  updateBlock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const blockId = req.params.block_id as string;

      const validation = updateBlockSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid block updation data',
          errors: validation.error.issues,
        });
        return;
      }

      const block = await this.blockService.updateBlock(userId, blockId, validation.data);

      res.status(200).json({
        success: true,
        message: 'Block updated successfully',
        data: { block },
      });
    } catch (error) {
      next(error);
    }
  };

  deleteBlock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const blockId = req.params.block_id;

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!blockId) {
        res.status(400).json({
          success: false,
          message: 'Page Id is required',
        });
        return;
      }

      if (typeof blockId !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Invalid Block Id',
        });
        return;
      }

      await this.blockService.deleteBlock(userId, blockId);

      res.status(200).json({
        success: true,
        message: 'Block deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };
}
