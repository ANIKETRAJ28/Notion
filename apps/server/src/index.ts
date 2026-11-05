import cookieParser from 'cookie-parser';
import express from 'express';

import { PORT } from './config/env.config.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { requestIdMiddleware } from './middleware/request-id.middleware.js';
import { router } from './routes/index.route.js';

export const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(requestIdMiddleware);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Application routes
app.use('/api', router);
// Centralized error handler
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
