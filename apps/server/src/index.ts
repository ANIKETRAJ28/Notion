import express from 'express';

import { requestIdMiddleware } from './middleware/request-id.middleware.js';

export const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(requestIdMiddleware);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});
