import { Router } from 'express';

import { pool } from '../config/database.config.js';
import { AuthController } from '../controller/auth.controller.js';
import { authenticationMiddleware } from '../middleware/auth.middleware.js';
import { AuthRepository } from '../repository/auth.repository.js';
import { SessionRepository } from '../repository/session.repository.js';
import { WorkspaceRepository } from '../repository/workspace.repository.js';
import { AuthService } from '../service/auth.service.js';

const router = Router();

const authRepository = new AuthRepository();
const workspaceRepository = new WorkspaceRepository();
const sessionRepository = new SessionRepository();
const authService = new AuthService(authRepository, workspaceRepository, sessionRepository, pool);
const authController = new AuthController(authService);

router.post('/login', authController.loginUser);
router.post('/register', authController.registerUser);
router.get('/logout', authController.logout);
router.get('/me', authenticationMiddleware, authController.getCurrentUser);

export default router;
