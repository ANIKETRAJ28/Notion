import { Router } from 'express';

import { pool } from '../config/database.config.js';
import { WorkspaceController } from '../controller/workspace.controller.js';
import { authenticationMiddleware } from '../middleware/auth.middleware.js';
import { WorkspaceRepository } from '../repository/workspace.repository.js';
import { WorkspaceService } from '../service/workspace.service.js';

const router = Router();

const workspaceRepository = new WorkspaceRepository();
const workspaceService = new WorkspaceService(workspaceRepository, pool);
const workspaceController = new WorkspaceController(workspaceService);

router.get('/', authenticationMiddleware, workspaceController.getUserWorkspaces);

export default router;
