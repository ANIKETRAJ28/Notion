import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';

import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from '../../../src/config/env.config';
import {
  issueAccessToken,
  issueRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../../../src/utils/token.util';

describe('Access Token', () => {
  it('should generate a valid access token', () => {
    const userId = 'user-123';
    const token = issueAccessToken(userId);
    expect(token).toBeTruthy();

    const decode = verifyAccessToken(token);
    expect(decode.userId).toBe(userId);
  });

  it('should reject an invalid access token', () => {
    expect(() => verifyAccessToken('invalid-token')).toThrow('Invalid or expired access token');
  });

  it('should reject an expired access token', () => {
    const expiredToken = jwt.sign({ type: 'access' }, ACCESS_TOKEN_SECRET, {
      subject: 'user-123',
      expiresIn: -1,
    });
    expect(() => verifyAccessToken(expiredToken)).toThrow('Invalid or expired access token');
  });

  it('should reject a refresh token used as an access token', () => {
    const refreshToken = issueRefreshToken('user-123', 'session-123');
    expect(() => verifyAccessToken(refreshToken)).toThrow('Invalid or expired access token');
  });
});

describe('Refresh Token', () => {
  it('should generate a valid refresh token', () => {
    const userId = 'user-123';
    const sessionId = 'session-123';

    const token = issueRefreshToken(userId, sessionId);
    expect(token).toBeTruthy();

    const decode = verifyRefreshToken(token);
    expect(decode.userId).toBe(userId);
    expect(decode.sessionId).toBe(sessionId);
  });

  it('should reject an invalid refresh token', () => {
    expect(() => verifyRefreshToken('invalid-token')).toThrow('Invalid or expired refresh token');
  });

  it('should reject an expired refresh token', () => {
    const expiredToken = jwt.sign({ type: 'refresh' }, REFRESH_TOKEN_SECRET, {
      subject: 'user-123',
      jwtid: 'session-123',
      expiresIn: -1,
    });
    expect(() => verifyRefreshToken(expiredToken)).toThrow('Invalid or expired refresh token');
  });

  it('should reject a access token used as refresh token', () => {
    const accessToken = issueAccessToken('user-123');
    expect(() => verifyRefreshToken(accessToken)).toThrow('Invalid or expired refresh token');
  });
});
