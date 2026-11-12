import { Router } from 'express';

import { pool } from '../config/database.config.js';
import { WorkspaceMemberController } from '../controller/workspace-member.controller.js';
import { authenticationMiddleware } from '../middleware/auth.middleware.js';
import { WorkspaceMemberRepository } from '../repository/workspace-member.repository.js';
import { WorkspaceMemberService } from '../service/workspace-member.service.js';

const router = Router();

const workspaceMemberRepository = new WorkspaceMemberRepository();
const workspaceMemberService = new WorkspaceMemberService(workspaceMemberRepository, pool);
const workspaceMemberController = new WorkspaceMemberController(workspaceMemberService);

router.use(authenticationMiddleware);

router.post('/', workspaceMemberController.createWorkspaceMember);

export default router;
