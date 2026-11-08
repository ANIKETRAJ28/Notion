import { Router } from 'express';

import authRoute from './auth.route.js';
import workspaceRouter from './workspace.route.js';

export const router = Router();

router.use('/auth', authRoute);
router.use('/workspaces', workspaceRouter);
