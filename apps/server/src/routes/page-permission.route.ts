import { Router } from 'express';

import { pool } from '../config/database.config.js';
import { PagePermissionController } from '../controller/page-permission.controller.js';
import { authenticationMiddleware } from '../middleware/auth.middleware.js';
import { PageRepository } from '../repository/page.repository.js';
import { PagePermissionRepository } from '../repository/page-permission.repository.js';
import { WorkspaceMemberRepository } from '../repository/workspace-member.repository.js';
import { PagePermissionService } from '../service/page-permission.service.js';

const router = Router();

const pagePermissionRepository = new PagePermissionRepository();
const pageRepository = new PageRepository();
const workspaceMemberRepository = new WorkspaceMemberRepository();
const pagePermissionService = new PagePermissionService(
  pagePermissionRepository,
  pageRepository,
  workspaceMemberRepository,
  pool,
);
const pagePermissionController = new PagePermissionController(pagePermissionService);

router.use(authenticationMiddleware);

router.post('/:pageId/permissions', pagePermissionController.grantPagePermission);
router.get('/:pageId/parmissions', pagePermissionController.getPagePermissionsForPage);
router.patch('/:pageId/permissions/:userId', pagePermissionController.updatePagePermission);
router.delete('/:pageId/permissions/:userId', pagePermissionController.revokePagePermission);

export default router;
