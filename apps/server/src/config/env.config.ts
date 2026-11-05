import dotenv from 'dotenv';

dotenv.config();

export const PORT = process.env.PORT ?? 3000;
export const DATABASE_URL = process.env.DATABASE_URL!;
export const SALT_ROUND = process.env.SALT_ROUND ?? 12;
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;
export const ACCESS_EXPIREY = process.env.ACCESS_EXPIREY ?? '15m';
export const REFRESH_EXPIREY = process.env.REFRESH_EXPIREY ?? '7d';
export const NODE_ENV = process.env.NODE_ENV ?? 'dev';

export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
