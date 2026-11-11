import { Router } from 'express';

import authRoute from './auth.route.js';
import pageRouter from './page.route.js';
import pagePermissionRouter from './page-permission.route.js';
import workspaceRouter from './workspace.route.js';

export const router = Router();

router.use('/auth', authRoute);
router.use('/workspaces', workspaceRouter);
router.use('/pages', pageRouter);
router.use('/page-permissions', pagePermissionRouter);
