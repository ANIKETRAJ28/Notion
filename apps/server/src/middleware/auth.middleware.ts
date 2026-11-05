import { NextFunction, Request, Response } from 'express';

import { AppError } from '../utils/app-error.util.js';
import { verifyAccessToken } from '../utils/token.util.js';

export const authenticationMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access token is required', 401);
    }
    // extract the access token
    const accessToken = authHeader.split(' ')[1];
    if (!accessToken) {
      throw new AppError('Invalid authorization header', 401);
    }
    // Verify access token
    const { userId } = verifyAccessToken(accessToken);
    // Attach authenticated user to request
    req.user = { id: userId };

    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError('Invalid or expired access token', 401));
  }
};
