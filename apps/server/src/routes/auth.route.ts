import { Router } from 'express';

import { pool } from '../config/database.config.js';
import { AuthController } from '../controller/auth.controller.js';
import { authenticationMiddleware } from '../middleware/auth.middleware.js';
import { SessionRepository } from '../repository/session.repository.js';
import { UserRepository } from '../repository/user.repository.js';
import { WorkspaceRepository } from '../repository/workspace.repository.js';
import { WorkSpaceMemberRepository } from '../repository/workspace-member.repository.js';
import { AuthService } from '../service/auth.service.js';

const router = Router();

const authRepository = new UserRepository();
const workspaceRepository = new WorkspaceRepository();
const workspaceMemberRepository = new WorkSpaceMemberRepository();
const sessionRepository = new SessionRepository();
const authService = new AuthService(
  authRepository,
  workspaceRepository,
  workspaceMemberRepository,
  sessionRepository,
  pool,
);
const authController = new AuthController(authService);

router.post('/login', authController.loginUser);
router.post('/register', authController.registerUser);
router.get('/logout', authController.logout);
router.get('/me', authenticationMiddleware, authController.getCurrentUser);

export default router;
