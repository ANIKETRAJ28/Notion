import bcrypt from 'bcrypt';
import { Pool, PoolClient } from 'pg';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SessionRepository } from '../../../src/repository/session.repository';
import { UserRepository } from '../../../src/repository/user.repository';
import { WorkspaceRepository } from '../../../src/repository/workspace.repository';
import { IUser, IUserWithPassword } from '../../../src/schema/auth.schema';
import { ISession } from '../../../src/schema/session.schema';
import { IWorkspace } from '../../../src/schema/workspace.schema';
import { AuthService } from '../../../src/service/auth.service';
import { issueRefreshToken } from '../../../src/utils/token.util';

const connectMock = vi.fn();
const findUserByEmailMock = vi.fn();
const createSessionMock = vi.fn();
const createUserMock = vi.fn();
const createPersonalWorkspaceMock = vi.fn();
const revokeSessionMock = vi.fn();
const findActiveSessionByIdMock = vi.fn();
const queryMock = vi.fn();

const client = {
  release: vi.fn(),
  query: queryMock,
} as unknown as PoolClient;

const clientPool = {
  connect: connectMock,
} as unknown as Pool;

const userRepository = {
  findUserByEmail: findUserByEmailMock,
  createUser: createUserMock,
} as unknown as UserRepository;

const workspaceRepository = {
  createPersonalWorkspace: createPersonalWorkspaceMock,
} as WorkspaceRepository;

const sessionRepository = {
  createSession: createSessionMock,
  revokeSession: revokeSessionMock,
  findActiveSessionById: findActiveSessionByIdMock,
} as unknown as SessionRepository;

let authService: AuthService;

const user: IUserWithPassword = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  password_hash: '',
  created_at: new Date(),
  updated_at: new Date(),
};

const registeredUser: IUser = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  created_at: new Date(),
  updated_at: new Date(),
};

const workspace: IWorkspace = {
  id: 'workspace-123',
  name: 'Personal Workspace',
  is_personal: true,
  created_by: 'user-123',
  created_at: new Date(),
  updated_at: new Date(),
};

const existingRefreshToken = issueRefreshToken(registeredUser.id, 'session-123');

const existingSession: ISession = {
  id: 'session-123',
  user_id: registeredUser.id,
  token_hash: '',
  expires_at: new Date(Date.now() + 60 * 60 * 1000),
  created_at: new Date(),
  revoked_at: null,
};

describe('AuthService - loginUser', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    connectMock.mockResolvedValue(client);
    authService = new AuthService(userRepository, workspaceRepository, sessionRepository, clientPool);
  });

  it('should successfully login a user', async () => {
    const password = 'correct-password';
    const passwordHash = await bcrypt.hash(password, 4);

    findUserByEmailMock.mockResolvedValue({
      ...user,
      password_hash: passwordHash,
    });

    createSessionMock.mockResolvedValue(undefined);

    const result = await authService.loginUser({ email: user.email, password });

    expect(result.user.id).toBe(user.id);
    expect(result.user.email).toBe(user.email);
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(findUserByEmailMock).toHaveBeenCalledOnce();
    expect(createSessionMock).toHaveBeenCalledOnce();
    expect(client.release).toHaveBeenCalledOnce();
  });

  it('should reject login when user does not exists', async () => {
    findUserByEmailMock.mockResolvedValue(null);

    await expect(
      authService.loginUser({
        email: 'unknown@example.com',
        password: '',
      }),
    ).rejects.toThrow('Email or password incorrect');

    expect(findUserByEmailMock).toHaveBeenCalledOnce();
    expect(createSessionMock).not.toHaveBeenCalled();
    expect(client.release).toHaveBeenCalledOnce();
  });

  it('should reject login when user exists but password is incorrect', async () => {
    const password = 'correct-password';
    const passwordHash = await bcrypt.hash(password, 4);

    findUserByEmailMock.mockResolvedValue({ ...user, password_hash: passwordHash });

    await expect(authService.loginUser({ email: user.email, password: 'incorrect-password' })).rejects.toThrow(
      'Email or password incorrect',
    );

    expect(findUserByEmailMock).toHaveBeenCalledOnce();
    expect(createSessionMock).not.toHaveBeenCalled();
    expect(client.release).toHaveBeenCalledOnce();
  });

  it('should reject login when session creation fails', async () => {
    const password = 'correct-password';
    const passwordHash = await bcrypt.hash(password, 4);

    findUserByEmailMock.mockResolvedValue({
      ...user,
      password_hash: passwordHash,
    });

    createSessionMock.mockRejectedValue(new Error('Database insertion failed'));

    await expect(authService.loginUser({ email: user.email, password })).rejects.toThrow('Database insertion failed');
    expect(findUserByEmailMock).toHaveBeenCalledOnce();
    expect(createSessionMock).toHaveBeenCalledOnce();
    expect(client.release).toHaveBeenCalledOnce();
  });

  it('should reject login when database connection fails', async () => {
    const password = 'correct-password';
    const passwordHash = await bcrypt.hash(password, 4);

    findUserByEmailMock.mockResolvedValue({
      ...user,
      password_hash: passwordHash,
    });
    createSessionMock.mockResolvedValue(undefined);
    connectMock.mockRejectedValue(new Error('Database connection failed'));

    await expect(authService.loginUser({ email: user.email, password })).rejects.toThrow('Database connection failed');
    expect(connectMock).toHaveBeenCalledOnce();
    expect(findUserByEmailMock).not.toHaveBeenCalled();
    expect(createSessionMock).not.toHaveBeenCalled();
    expect(client.release).not.toHaveBeenCalledOnce();
  });

  it('should not return password hash in user details', async () => {
    const password = 'correct-password';
    const passwordHash = await bcrypt.hash(password, 4);

    findUserByEmailMock.mockResolvedValue({
      ...user,
      password_hash: passwordHash,
    });

    createSessionMock.mockResolvedValue(undefined);

    const result = await authService.loginUser({
      email: user.email,
      password,
    });

    expect(createSessionMock).toHaveBeenCalledOnce();
    expect(connectMock).toHaveBeenCalledOnce();
    expect(result).not.toHaveProperty('password_hash');
    expect(result).not.toHaveProperty('password');
    expect(result.user.id).toBe(user.id);
    expect(client.release).toHaveBeenCalledOnce();
  });

  it('should store hashed refresh token in session', async () => {
    const password = 'correct-password';
    const passwordHash = await bcrypt.hash(password, 4);

    findUserByEmailMock.mockResolvedValue({
      ...user,
      password_hash: passwordHash,
    });

    createSessionMock.mockResolvedValue(undefined);

    const result = await authService.loginUser({
      email: user.email,
      password,
    });

    const sessionPayload = createSessionMock.mock.calls[0][1];
    expect(sessionPayload.token_hash).not.toBe(result.refreshToken);

    const isValidHash = await bcrypt.compare(result.refreshToken, sessionPayload.token_hash);
    expect(isValidHash).toBe(true);
  });

  it('should propagate error when user lookup fails', async () => {
    findUserByEmailMock.mockRejectedValue(new Error('Database query failed'));

    await expect(
      authService.loginUser({
        email: user.email,
        password: 'correct-password',
      }),
    ).rejects.toThrow('Database query failed');

    expect(createSessionMock).not.toHaveBeenCalled();
    expect(client.release).toHaveBeenCalledOnce();
  });

  it('should create session for the authenticated user', async () => {
    const password = 'correct-password';
    const passwordHash = await bcrypt.hash(password, 4);

    findUserByEmailMock.mockResolvedValue({
      ...user,
      password_hash: passwordHash,
    });

    createSessionMock.mockResolvedValue(undefined);

    await authService.loginUser({
      email: user.email,
      password,
    });

    const sessionPayload = createSessionMock.mock.calls[0][1];

    expect(sessionPayload.user_id).toBe(user.id);
    expect(createSessionMock).toHaveBeenCalledOnce();
  });
});

describe('AuthService - registerUser', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    connectMock.mockResolvedValue(client);
    queryMock.mockResolvedValue({ rows: [], rowCount: 0 });
    authService = new AuthService(userRepository, workspaceRepository, sessionRepository, clientPool);
  });

  it('should successfully register user', async () => {
    createUserMock.mockResolvedValue(registeredUser);
    createPersonalWorkspaceMock.mockResolvedValue(workspace);
    createSessionMock.mockResolvedValue(undefined);

    const result = await authService.registerUser({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    const createdUserPayload = createUserMock.mock.calls[0][1];

    const isValidHash = await bcrypt.compare('password123', createdUserPayload.password);

    expect(createdUserPayload.password).not.toBe('password123');
    expect(isValidHash).toBe(true);
    expect(result.user).toEqual(registeredUser);
    expect(result.workspace).toEqual(workspace);
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();

    expect(createUserMock).toHaveBeenCalledOnce();
    expect(createPersonalWorkspaceMock).toHaveBeenCalledOnce();
    expect(createSessionMock).toHaveBeenCalledOnce();

    expect(queryMock).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(queryMock).toHaveBeenNthCalledWith(2, 'COMMIT');

    expect(client.release).toHaveBeenCalledOnce();
  });

  it('should reject registration when email is already registered', async () => {
    const duplicateEmailError = Object.assign(new Error('duplicate key value violates unique constraint'), {
      code: '23505',
    });

    createUserMock.mockRejectedValue(duplicateEmailError);

    await expect(
      authService.registerUser({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow('Email already registered');

    expect(createUserMock).toHaveBeenCalledOnce();
    expect(createPersonalWorkspaceMock).not.toHaveBeenCalled();
    expect(createSessionMock).not.toHaveBeenCalled();
    expect(queryMock).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(queryMock).toHaveBeenNthCalledWith(2, 'ROLLBACK');
    expect(client.release).toHaveBeenCalledOnce();
  });

  it('should rollback transaction when session creation fails', async () => {
    createUserMock.mockResolvedValue(registeredUser);
    createPersonalWorkspaceMock.mockResolvedValue(workspace);
    createSessionMock.mockRejectedValue(new Error('Session creation failed'));

    await expect(
      authService.registerUser({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow('Session creation failed');

    expect(createUserMock).toHaveBeenCalledOnce();
    expect(createPersonalWorkspaceMock).toHaveBeenCalledOnce();
    expect(createSessionMock).toHaveBeenCalledOnce();

    expect(queryMock).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(queryMock).toHaveBeenNthCalledWith(2, 'ROLLBACK');

    expect(client.release).toHaveBeenCalledOnce();
  });

  it('should rollback transaction when commit fails', async () => {
    createUserMock.mockResolvedValue(registeredUser);
    createPersonalWorkspaceMock.mockResolvedValue(workspace);
    createSessionMock.mockResolvedValue(undefined);

    queryMock.mockImplementation(async (command) => {
      if (command === 'COMMIT') {
        throw new Error('Commit failed');
      }
      return { rows: [], rowCount: 0 };
    });

    await expect(
      authService.registerUser({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow('Commit failed');

    expect(createUserMock).toHaveBeenCalledOnce();
    expect(createPersonalWorkspaceMock).toHaveBeenCalledOnce();
    expect(createSessionMock).toHaveBeenCalledOnce();

    expect(queryMock).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(queryMock).toHaveBeenNthCalledWith(2, 'COMMIT');
    expect(queryMock).toHaveBeenNthCalledWith(3, 'ROLLBACK');

    expect(client.release).toHaveBeenCalledOnce();
  });

  it('should not proceed when transaction fails to start', async () => {
    queryMock.mockRejectedValue(new Error('Transaction start failed'));

    await expect(
      authService.registerUser({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow('Transaction start failed');

    expect(createUserMock).not.toHaveBeenCalled();
    expect(createPersonalWorkspaceMock).not.toHaveBeenCalled();
    expect(createSessionMock).not.toHaveBeenCalled();

    expect(queryMock).toHaveBeenCalledWith('BEGIN');
    expect(queryMock).not.toHaveBeenCalledWith('ROLLBACK');

    expect(client.release).toHaveBeenCalledOnce();
  });
});

describe('AuthService - refereshAccessToken', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    connectMock.mockResolvedValue(client);
    queryMock.mockResolvedValue({ rows: [], rowCount: 0 });
    authService = new AuthService(userRepository, workspaceRepository, sessionRepository, clientPool);
  });

  it('should successfully refresh access and refresh tokens', async () => {
    const tokenHash = await bcrypt.hash(existingRefreshToken, 4);

    const session: ISession = {
      ...existingSession,
      token_hash: tokenHash,
    };

    findActiveSessionByIdMock.mockResolvedValue(session);
    revokeSessionMock.mockResolvedValue(true);
    createSessionMock.mockResolvedValue(undefined);

    const result = await authService.refreshAccessToken(existingRefreshToken);

    expect(result.refreshToken).toBeTruthy();
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).not.toBe(result.accessToken);

    expect(findActiveSessionByIdMock).toHaveBeenCalledOnce();
    expect(revokeSessionMock).toHaveBeenCalledOnce();
    expect(createSessionMock).toHaveBeenCalledOnce();

    const findSessionId = findActiveSessionByIdMock.mock.calls[0][1];
    const revokeSessionId = revokeSessionMock.mock.calls[0][1];

    expect(findSessionId).toBe(existingSession.id);
    expect(revokeSessionId).toBe(existingSession.id);
    expect(revokeSessionMock).toHaveBeenCalledWith(client, existingSession.id);

    expect(queryMock).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(queryMock).toHaveBeenNthCalledWith(2, 'COMMIT');

    expect(client.release).toHaveBeenCalledOnce();
  });

  it('should reject refresh when the session is missing or expired', async () => {
    findActiveSessionByIdMock.mockResolvedValue(null);

    await expect(authService.refreshAccessToken(existingRefreshToken)).rejects.toThrow(
      'Invalid or expired refresh token',
    );

    expect(findActiveSessionByIdMock).toHaveBeenCalledOnce();
    expect(findActiveSessionByIdMock).toHaveBeenCalledWith(client, existingSession.id);

    expect(revokeSessionMock).not.toHaveBeenCalled();
    expect(createSessionMock).not.toHaveBeenCalled();

    expect(queryMock).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(queryMock).toHaveBeenNthCalledWith(2, 'ROLLBACK');

    expect(client.release).toHaveBeenCalledOnce();
  });

  it('should reject refresh when the refresh token hash does not match', async () => {
    const incorrectTokenHash = await bcrypt.hash('incorrect-token', 4);

    const session: ISession = {
      ...existingSession,
      token_hash: incorrectTokenHash,
    };

    findActiveSessionByIdMock.mockResolvedValue(session);

    await expect(authService.refreshAccessToken(existingRefreshToken)).rejects.toThrow('Invalid refresh token');

    expect(findActiveSessionByIdMock).toHaveBeenCalledOnce();
    expect(findActiveSessionByIdMock).toHaveBeenCalledWith(client, existingSession.id);

    expect(revokeSessionMock).not.toHaveBeenCalled();
    expect(createSessionMock).not.toHaveBeenCalled();

    expect(queryMock).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(queryMock).toHaveBeenNthCalledWith(2, 'ROLLBACK');

    expect(client.release).toHaveBeenCalledOnce();
  });

  it('should reject refresh when the old session cannot be revoked', async () => {
    const tokenHash = await bcrypt.hash(existingRefreshToken, 4);

    const session: ISession = {
      ...existingSession,
      token_hash: tokenHash,
    };

    findActiveSessionByIdMock.mockResolvedValue(session);
    revokeSessionMock.mockResolvedValue(false);

    await expect(authService.refreshAccessToken(existingRefreshToken)).rejects.toThrow('Session is no longer active');

    expect(findActiveSessionByIdMock).toHaveBeenCalledOnce();
    expect(findActiveSessionByIdMock).toHaveBeenCalledWith(client, existingSession.id);
    expect(revokeSessionMock).toHaveBeenCalledOnce();
    expect(revokeSessionMock).toHaveBeenCalledWith(client, existingSession.id);

    expect(createSessionMock).not.toHaveBeenCalled();

    expect(queryMock).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(queryMock).toHaveBeenNthCalledWith(2, 'ROLLBACK');

    expect(client.release).toHaveBeenCalledOnce();
  });

  it('should rollback when creating the new session fails', async () => {
    const tokenHash = await bcrypt.hash(existingRefreshToken, 4);
    const session: ISession = {
      ...existingSession,
      token_hash: tokenHash,
    };

    findActiveSessionByIdMock.mockResolvedValue(session);
    revokeSessionMock.mockResolvedValue(true);
    createSessionMock.mockRejectedValue(new Error('Failed to create session'));

    await expect(authService.refreshAccessToken(existingRefreshToken)).rejects.toThrow('Failed to create session');

    expect(findActiveSessionByIdMock).toHaveBeenCalledOnce();
    expect(findActiveSessionByIdMock).toHaveBeenCalledWith(client, existingSession.id);

    expect(revokeSessionMock).toHaveBeenCalledOnce();
    expect(revokeSessionMock).toHaveBeenCalledWith(client, existingSession.id);

    expect(createSessionMock).toHaveBeenCalledOnce();

    expect(queryMock).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(queryMock).toHaveBeenNthCalledWith(2, 'ROLLBACK');

    expect(client.release).toHaveBeenCalledOnce();
  });

  it('should release connection when BEGIN transaction fails', async () => {
    queryMock.mockRejectedValue(new Error('Failed to begin transaction'));

    await expect(authService.refreshAccessToken(existingRefreshToken)).rejects.toThrow('Failed to begin transaction');

    expect(queryMock).toHaveBeenCalledOnce();
    expect(queryMock).toHaveBeenCalledWith('BEGIN');

    expect(findActiveSessionByIdMock).not.toHaveBeenCalled();
    expect(revokeSessionMock).not.toHaveBeenCalled();
    expect(createSessionMock).not.toHaveBeenCalled();

    expect(queryMock).not.toHaveBeenCalledWith('ROLLBACK');

    expect(client.release).toHaveBeenCalledOnce();
  });

  it('should rollback when COMMIT fails', async () => {
    const tokenHash = await bcrypt.hash(existingRefreshToken, 4);

    const session = {
      ...existingSession,
      token_hash: tokenHash,
    };

    findActiveSessionByIdMock.mockResolvedValue(session);
    revokeSessionMock.mockResolvedValue(true);
    createSessionMock.mockResolvedValue(undefined);

    queryMock.mockImplementation(async (command) => {
      if (command === 'COMMIT') {
        throw new Error('Failed to commit transaction');
      }
      return { rows: [], rowCount: 0 };
    });

    await expect(authService.refreshAccessToken(existingRefreshToken)).rejects.toThrow('Failed to commit transaction');

    expect(findActiveSessionByIdMock).toHaveBeenCalledOnce();
    expect(findActiveSessionByIdMock).toHaveBeenCalledWith(client, existingSession.id);
    expect(createSessionMock).toHaveBeenCalledOnce();

    expect(revokeSessionMock).toHaveBeenCalledOnce();
    expect(revokeSessionMock).toHaveBeenCalledWith(client, existingSession.id);

    expect(queryMock).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(queryMock).toHaveBeenNthCalledWith(2, 'COMMIT');
    expect(queryMock).toHaveBeenNthCalledWith(3, 'ROLLBACK');

    expect(client.release).toHaveBeenCalledOnce();
  });

  it('should reject an invalid refresh token', async () => {
    const invalidRefreshToken = 'invalid-refresh-token';

    await expect(authService.refreshAccessToken(invalidRefreshToken)).rejects.toThrow();

    expect(connectMock).not.toHaveBeenCalled();
    expect(queryMock).not.toHaveBeenCalled();

    expect(findActiveSessionByIdMock).not.toHaveBeenCalled();
    expect(revokeSessionMock).not.toHaveBeenCalled();
    expect(createSessionMock).not.toHaveBeenCalled();

    expect(client.release).not.toHaveBeenCalled();
  });

  it('should reject refresh when session belongs to another user', async () => {
    const tokenHash = await bcrypt.hash(existingRefreshToken, 4);

    const session = {
      ...existingSession,
      user_id: 'another-user-id',
      token_hash: tokenHash,
    };

    findActiveSessionByIdMock.mockResolvedValue(session);

    await expect(authService.refreshAccessToken(existingRefreshToken)).rejects.toThrow(
      'Invalid or expired refresh token',
    );

    expect(findActiveSessionByIdMock).toHaveBeenCalledOnce();

    expect(revokeSessionMock).not.toHaveBeenCalled();
    expect(createSessionMock).not.toHaveBeenCalled();

    expect(queryMock).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(queryMock).toHaveBeenNthCalledWith(2, 'ROLLBACK');

    expect(client.release).toHaveBeenCalledOnce();
  });
});

describe('AuthService - login', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    connectMock.mockResolvedValue(client);
    queryMock.mockResolvedValue({ rows: [], rowCount: 0 });
    authService = new AuthService(userRepository, workspaceRepository, sessionRepository, clientPool);
  });

  it('should successfully logout a user', async () => {
    const tokenHash = await bcrypt.hash(existingRefreshToken, 4);
    const session: ISession = {
      ...existingSession,
      token_hash: tokenHash,
    };

    findActiveSessionByIdMock.mockResolvedValue(session);
    revokeSessionMock.mockResolvedValue(true);

    await authService.logout(existingRefreshToken);

    expect(findActiveSessionByIdMock).toHaveBeenCalled();
    expect(findActiveSessionByIdMock).toHaveBeenCalledWith(client, existingSession.id);

    expect(revokeSessionMock).toHaveBeenCalledOnce();
    expect(revokeSessionMock).toHaveBeenCalledWith(client, existingSession.id);

    expect(client.release).toHaveBeenCalledOnce();
  });

  it('should reject logout when the session is missing or expired', async () => {
    findActiveSessionByIdMock.mockResolvedValue(null);

    await expect(authService.logout(existingRefreshToken)).rejects.toThrow('Invalid or expired refresh token');

    expect(findActiveSessionByIdMock).toHaveBeenCalledOnce();
    expect(findActiveSessionByIdMock).toHaveBeenCalledWith(client, existingSession.id);

    expect(revokeSessionMock).not.toHaveBeenCalled();

    expect(client.release).toHaveBeenCalledOnce();
  });

  it('should reject logout when session belongs to another user', async () => {
    const tokenHash = await bcrypt.hash(existingRefreshToken, 4);
    const session = {
      ...existingSession,
      user_id: 'another-user-id',
      token_hash: tokenHash,
    };

    findActiveSessionByIdMock.mockResolvedValue(session);

    await expect(authService.logout(existingRefreshToken)).rejects.toThrow('Invalid or expired refresh token');

    expect(findActiveSessionByIdMock).toHaveBeenCalledOnce();
    expect(revokeSessionMock).not.toHaveBeenCalledOnce();

    expect(client.release).toHaveBeenCalledOnce();
  });

  it('should reject logout when refresh token hash does not match', async () => {
    const wrongTokenHash = await bcrypt.hash('some-other-token', 4);

    const session = {
      ...existingSession,
      token_hash: wrongTokenHash,
    };

    findActiveSessionByIdMock.mockResolvedValue(session);

    await expect(authService.logout(existingRefreshToken)).rejects.toThrow('Invalid refresh token');

    expect(findActiveSessionByIdMock).toHaveBeenCalledOnce();
    expect(findActiveSessionByIdMock).toHaveBeenCalledWith(client, existingSession.id);

    expect(revokeSessionMock).not.toHaveBeenCalled();

    expect(client.release).toHaveBeenCalledOnce();
  });

  it('should release connection when session revocation fails', async () => {
    const tokenHash = await bcrypt.hash(existingRefreshToken, 4);

    const session = {
      ...existingSession,
      token_hash: tokenHash,
    };

    findActiveSessionByIdMock.mockResolvedValue(session);

    revokeSessionMock.mockRejectedValue(new Error('Failed to revoke session'));

    await expect(authService.logout(existingRefreshToken)).rejects.toThrow('Failed to revoke session');

    expect(findActiveSessionByIdMock).toHaveBeenCalledOnce();

    expect(revokeSessionMock).toHaveBeenCalledOnce();
    expect(revokeSessionMock).toHaveBeenCalledWith(client, existingSession.id);

    expect(client.release).toHaveBeenCalledOnce();
  });

  it('should complete logout when session revocation returns false', async () => {
    const tokenHash = await bcrypt.hash(existingRefreshToken, 4);

    const session = {
      ...existingSession,
      token_hash: tokenHash,
    };

    findActiveSessionByIdMock.mockResolvedValue(session);
    revokeSessionMock.mockResolvedValue(false);

    await expect(authService.logout(existingRefreshToken)).resolves.toBeUndefined();

    expect(findActiveSessionByIdMock).toHaveBeenCalledOnce();

    expect(revokeSessionMock).toHaveBeenCalledOnce();
    expect(revokeSessionMock).toHaveBeenCalledWith(client, existingSession.id);

    expect(client.release).toHaveBeenCalledOnce();
  });

  it('should reject logout when refresh token is invalid', async () => {
    const invalidRefreshToken = 'invalid-token';

    await expect(authService.logout(invalidRefreshToken)).rejects.toThrow();

    expect(connectMock).not.toHaveBeenCalled();

    expect(findActiveSessionByIdMock).not.toHaveBeenCalled();
    expect(revokeSessionMock).not.toHaveBeenCalled();
    expect(createSessionMock).not.toHaveBeenCalled();

    expect(client.release).not.toHaveBeenCalled();
  });

  it('should release connection when finding the session fails', async () => {
    findActiveSessionByIdMock.mockRejectedValue(new Error('Database query failed'));

    await expect(authService.logout(existingRefreshToken)).rejects.toThrow('Database query failed');

    expect(findActiveSessionByIdMock).toHaveBeenCalledOnce();

    expect(findActiveSessionByIdMock).toHaveBeenCalledWith(client, existingSession.id);

    expect(revokeSessionMock).not.toHaveBeenCalled();

    expect(client.release).toHaveBeenCalledOnce();
  });
});
