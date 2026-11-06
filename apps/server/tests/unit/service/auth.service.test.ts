import bcrypt from 'bcrypt';
import { Pool, PoolClient } from 'pg';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthRepository } from '../../../src/repository/auth.repository';
import { SessionRepository } from '../../../src/repository/session.repository';
import { WorkspaceRepository } from '../../../src/repository/workspace.repository';
import { IUserWithPassword } from '../../../src/schema/auth.schema';
import { AuthService } from '../../../src/service/auth.service';

const connectMock = vi.fn();
const findUserByEmailMock = vi.fn();
const createSessionMock = vi.fn();

const client = {
  release: vi.fn(),
} as unknown as PoolClient;

const clientPool = {
  connect: connectMock,
} as unknown as Pool;

const authRepository = {
  findUserByEmail: findUserByEmailMock,
} as unknown as AuthRepository;

const workspaceRepository = {} as WorkspaceRepository;

const sessionRepository = {
  createSession: createSessionMock,
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

describe('AuthService - loginUser', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    connectMock.mockResolvedValue(client);
    authService = new AuthService(authRepository, workspaceRepository, sessionRepository, clientPool);
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
