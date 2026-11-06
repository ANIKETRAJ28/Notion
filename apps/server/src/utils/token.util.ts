import jwt from 'jsonwebtoken';

import { ACCESS_EXPIREY, ACCESS_TOKEN_SECRET, REFRESH_EXPIREY, REFRESH_TOKEN_SECRET } from '../config/env.config.js';
import { AppError } from './app-error.util.js';

export const issueAccessToken = (userId: string): string => {
  const token = jwt.sign({ type: 'access' }, ACCESS_TOKEN_SECRET, {
    subject: userId,
    expiresIn: ACCESS_EXPIREY as jwt.SignOptions['expiresIn'],
  });
  return token;
};

export const issueRefreshToken = (userId: string, sessionId: string): string => {
  const token = jwt.sign({ type: 'refresh' }, REFRESH_TOKEN_SECRET, {
    subject: userId,
    jwtid: sessionId,
    expiresIn: REFRESH_EXPIREY as jwt.SignOptions['expiresIn'],
  });

  return token;
};

export const verifyAccessToken = (token: string): { userId: string } => {
  try {
    const decode = jwt.verify(token, ACCESS_TOKEN_SECRET);

    if (typeof decode === 'string' || decode.type !== 'access' || !decode.sub) {
      throw new AppError('Invalid access token', 401);
    }
    return { userId: decode.sub };
  } catch {
    throw new AppError('Invalid or expired access token', 401);
  }
};

export const verifyRefreshToken = (token: string): { userId: string; sessionId: string } => {
  try {
    const decode = jwt.verify(token, REFRESH_TOKEN_SECRET);
    if (typeof decode === 'string' || decode.type !== 'refresh' || !decode.sub || !decode.jti) {
      throw new AppError('Invalid refresh token', 401);
    }
    return { userId: decode.sub, sessionId: decode.jti };
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }
};
