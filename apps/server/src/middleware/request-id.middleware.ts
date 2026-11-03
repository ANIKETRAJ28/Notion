import { randomUUID } from 'node:crypto';

import type { NextFunction, RequestHandler, Response } from 'express';

export const requestIdMiddleware: RequestHandler = (_req, res: Response, next: NextFunction) => {
  const requestId = randomUUID();

  res.locals.requetId = requestId;
  res.setHeader('X-Request-ID', requestId);

  next();
};
