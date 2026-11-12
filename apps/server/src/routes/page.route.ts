import { Router } from 'express';

import { pool } from '../config/database.config.js';
import { PageController } from '../controller/page.controller.js';
import { authenticationMiddleware } from '../middleware/auth.middleware.js';
import { PageRepository } from '../repository/page.repository.js';
import { PagePermissionRepository } from '../repository/page-permission.repository.js';
import { WorkspaceMemberRepository } from '../repository/workspace-member.repository.js';
import { PageService } from '../service/page.service.js';

const router = Router();

const pageRepository = new PageRepository();
const pagePermissionRepository = new PagePermissionRepository();
const workSpaceMemberRepository = new WorkspaceMemberRepository();
const pageService = new PageService(pageRepository, pagePermissionRepository, workSpaceMemberRepository, pool);
const pageController = new PageController(pageService);

router.use(authenticationMiddleware);

router.post('/', pageController.createPage);
router.get('/workspaces/:workspace_id', pageController.getWorkspacePages);
router.get('/:page_id', pageController.getPageById);
router.patch('/:page_id', pageController.updatePage);
router.delete('/:page_id', pageController.deletePage);

export default router;
