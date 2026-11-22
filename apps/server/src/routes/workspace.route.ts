import { Router } from 'express';

import { pool } from '../config/database.config.js';
import { WorkspaceController } from '../controller/workspace.controller.js';
import { authenticationMiddleware } from '../middleware/auth.middleware.js';
import { WorkspaceRepository } from '../repository/workspace.repository.js';
import { WorkspaceMemberRepository } from '../repository/workspace-member.repository.js';
import { WorkspaceService } from '../service/workspace.service.js';

const router = Router();

const workspaceRepository = new WorkspaceRepository();
const workspaceMemberRepository = new WorkspaceMemberRepository();
const workspaceService = new WorkspaceService(workspaceRepository, workspaceMemberRepository, pool);
const workspaceController = new WorkspaceController(workspaceService);

router.use(authenticationMiddleware);

router.get('/', workspaceController.getUserWorkspaces);
router.post('/', workspaceController.createWorkspace);

export default router;
