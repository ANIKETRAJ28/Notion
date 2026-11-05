import { NextFunction, Request, Response } from 'express';

import { AppError } from '../utils/app-error.util.js';

export const errorMiddleware = (error: unknown, _req: Request, res: Response, next: NextFunction): void => {
  console.error(error);

  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};
