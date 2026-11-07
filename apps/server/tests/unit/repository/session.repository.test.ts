import { PoolClient } from 'pg';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionRepository } from '../../../src/repository/session.repository';
import { ICreateSession, ISession } from '../../../src/schema/session.schema';

const queryMock = vi.fn();

const client = {
  query: queryMock,
} as unknown as PoolClient;

const existingSession: ISession = {
  id: 'session-123',
  user_id: 'user-123',
  token_hash: 'hashed-refresh-token',
  expires_at: new Date(Date.now() + 60 * 60 * 1000),
  created_at: new Date(),
  revoked_at: null,
};

const session: ICreateSession = {
  id: 'session-123',
  user_id: 'user-123',
  token_hash: 'hashed-refresh-token',
  expires_at: new Date(Date.now() + 60 * 60 * 1000),
};

const sessionRepository = new SessionRepository();

describe('SessionRepository - createSession', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should successfully create a session', async () => {
    queryMock.mockResolvedValue({
      rows: [],
      rowCount: 1,
    });

    const result = await sessionRepository.createSession(client, session);

    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO sessions'), [
      session.id,
      session.user_id,
      session.token_hash,
      session.expires_at,
    ]);

    expect(result).toBeUndefined();
  });

  it('should throw an error when database query fails', async () => {
    queryMock.mockRejectedValue(new Error('Database query failed'));

    await expect(sessionRepository.createSession(client, session)).rejects.toThrow('Database query failed');

    expect(queryMock).toHaveBeenCalledOnce();
  });
});

describe('SessionRepository - findActiveSessionById', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should successfully find an active session by ID', async () => {
    queryMock.mockResolvedValue({
      rows: [existingSession],
      rowCount: 1,
    });

    const result = await sessionRepository.findActiveSessionById(client, 'session-123');

    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM sessions'), [existingSession.id]);

    expect(queryMock.mock.calls[0][0]).toContain('revoked_at IS NULL');
    expect(queryMock.mock.calls[0][0]).toContain('expires_at > NOW()');
    expect(queryMock.mock.calls[0][0]).toContain('FOR UPDATE');

    expect(result).toEqual(existingSession);
  });

  it('should return null when no active session is found', async () => {
    queryMock.mockResolvedValue({
      rows: [],
      rowCount: 0,
    });

    const result = await sessionRepository.findActiveSessionById(client, 'no-session-123');

    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM sessions'), ['no-session-123']);

    expect(result).toBeNull();
  });

  it('should throw an error when database query fails', async () => {
    queryMock.mockRejectedValue(new Error('Database query failed'));

    await expect(sessionRepository.findActiveSessionById(client, existingSession.id)).rejects.toThrow(
      'Database query failed',
    );

    expect(queryMock).toHaveBeenCalledTimes(1);
  });
});

describe('SessionRepository - revokeSession', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should successfully revoke an active session', async () => {
    queryMock.mockResolvedValue({
      rows: [],
      rowCount: 1,
    });

    const result = await sessionRepository.revokeSession(client, existingSession.id);

    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining('UPDATE sessions SET revoked_at = NOW()'), [
      existingSession.id,
    ]);

    expect(queryMock.mock.calls[0][0]).toContain('AND revoked_at IS NULL');

    expect(result).toBe(true);
  });

  it('should return false when no active session is found to revoke', async () => {
    queryMock.mockResolvedValue({
      rows: [],
      rowCount: 0,
    });

    const result = await sessionRepository.revokeSession(client, existingSession.id);

    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining('UPDATE sessions SET revoked_at = NOW()'), [
      existingSession.id,
    ]);

    expect(result).toBe(false);
  });

  it('should throw an error when database query fails', async () => {
    queryMock.mockRejectedValue(new Error('Database query failed'));

    await expect(sessionRepository.revokeSession(client, existingSession.id)).rejects.toThrow('Database query failed');

    expect(queryMock).toHaveBeenCalledTimes(1);
  });
});
