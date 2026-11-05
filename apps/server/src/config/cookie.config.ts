import { CookieOptions } from 'express';

import { NODE_ENV, REFRESH_TOKEN_TTL_MS } from './env.config.js';

export const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/auth',
  maxAge: REFRESH_TOKEN_TTL_MS,
};
