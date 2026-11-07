import { PoolClient } from 'pg';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserRepository } from '../../../src/repository/user.repository';
import { IRegisterUser, IUser, IUserWithPassword } from '../../../src/schema/auth.schema';

const queryMock = vi.fn();

const client = {
  query: queryMock,
} as unknown as PoolClient;

const userData: IRegisterUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
};

const createdUser: IUser = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  created_at: new Date(),
  updated_at: new Date(),
};

const existingUser: IUserWithPassword = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@example.com',
  password_hash: 'hashed-password',
  created_at: new Date(),
  updated_at: new Date(),
};

const userRepository = new UserRepository();

describe('UserRepository - createUser', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should successfully create a user', async () => {
    queryMock.mockResolvedValue({
      rows: [createdUser],
      rowCount: 1,
    });

    const result = await userRepository.createUser(client, userData);

    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO users'), [
      'Test User',
      'test@example.com',
      'password123',
    ]);

    expect(result).toEqual(createdUser);
  });

  it('should throw an error when database query fails', async () => {
    queryMock.mockRejectedValue(new Error('Database query failed'));

    await expect(userRepository.createUser(client, userData)).rejects.toThrow('Database query failed');

    expect(queryMock).toHaveBeenCalledOnce();
  });
});

describe('UserRepository - findUserByEmail', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should successfully find a user by email', async () => {
    queryMock.mockResolvedValue({
      rows: [existingUser],
      rowCount: 0,
    });

    const result = await userRepository.findUserByEmail(client, 'test@example.com');

    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM users'), [existingUser.email]);

    expect(result).toEqual(existingUser);
  });

  it('should return null when user does not exist', async () => {
    queryMock.mockResolvedValue({
      rows: [],
      rowCount: 0,
    });

    const result = await userRepository.findUserByEmail(client, 'test@example.com');

    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM users'), [existingUser.email]);

    expect(result).toBeNull();
  });

  it('should throw an error when database query fails', async () => {
    queryMock.mockRejectedValue(new Error('Database query failed'));

    await expect(userRepository.findUserByEmail(client, 'test@example.com')).rejects.toThrow('Database query failed');

    expect(queryMock).toHaveBeenCalledOnce();
  });
});
