import { Router } from 'express';

import authRoute from './auth.route.js';

export const router = Router();

router.use('/auth', authRoute);
