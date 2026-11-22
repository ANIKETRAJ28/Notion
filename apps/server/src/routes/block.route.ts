import { Router } from 'express';

import { pool } from '../config/database.config.js';
import { BlockController } from '../controller/block.controller.js';
import { authenticationMiddleware } from '../middleware/auth.middleware.js';
import { BlockRepository } from '../repository/block.repository.js';
import { PageRepository } from '../repository/page.repository.js';
import { PagePermissionRepository } from '../repository/page-permission.repository.js';
import { WorkspaceMemberRepository } from '../repository/workspace-member.repository.js';
import { BlockService } from '../service/block.service.js';

const router = Router();

const blockRepository = new BlockRepository();
const pageRepository = new PageRepository();
const pagePermissionRepository = new PagePermissionRepository();
const workspaceMemberRepository = new WorkspaceMemberRepository();

const blockService = new BlockService(
  blockRepository,
  pagePermissionRepository,
  pageRepository,
  workspaceMemberRepository,
  pool,
);

const blockController = new BlockController(blockService);

router.use(authenticationMiddleware);

router.get('/page/:page_id', blockController.getBlockForPage);
router.get('/:block_id', blockController.getBlockById);
router.post('/', blockController.createBlock);
router.patch('/:block_id', blockController.updateBlock);
router.delete('/:block_id', blockController.deleteBlock);

export default router;
