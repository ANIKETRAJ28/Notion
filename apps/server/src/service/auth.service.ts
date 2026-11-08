import { randomUUID } from 'node:crypto';

import bcrypt from 'bcrypt';
import { Pool } from 'pg';

import { REFRESH_TOKEN_TTL_MS, SALT_ROUND } from '../config/env.config.js';
import { SessionRepository } from '../repository/session.repository.js';
import { UserRepository } from '../repository/user.repository.js';
import { WorkspaceRepository } from '../repository/workspace.repository.js';
import { WorkSpaceMemberRepository } from '../repository/workspace-member.repository.js';
import type { IRegisterUser, IUser, IUserLogin, IUserWithPassword } from '../schema/auth.schema.js';
import { ICreateSession, ISession } from '../schema/session.schema.js';
import { IWorkspace } from '../schema/workspace.schema.js';
import { AppError } from '../utils/app-error.util.js';
import { issueAccessToken, issueRefreshToken, verifyRefreshToken } from '../utils/token.util.js';

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly workspaceMemberRepository: WorkSpaceMemberRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly clientPool: Pool,
  ) {}

  async registerUser(data: IRegisterUser): Promise<{
    user: IUser;
    workspace: IWorkspace;
    accessToken: string;
    refreshToken: string;
  }> {
    const client = await this.clientPool.connect();
    let transactionStarted = false;
    try {
      const hashPassword = await bcrypt.hash(data.password, SALT_ROUND);
      // Start transaction
      await client.query('BEGIN');
      transactionStarted = true;
      // Create user
      const user = await this.userRepository.createUser(client, {
        ...data,
        password: hashPassword,
      });
      // Create personal workspace
      const workspace = await this.workspaceRepository.createPersonalWorkspace(client, {
        name: 'Personal Workspace',
        is_personal: true,
        created_by: user.id,
      });

      // Create workspace-member mapping
      await this.workspaceMemberRepository.createWorkspaceMember(client, {
        user_id: user.id,
        workspace_id: workspace.id,
        role: 'owner',
      });

      const sessionId = randomUUID();
      const accessToken = issueAccessToken(user.id);
      const refreshToken = issueRefreshToken(user.id, sessionId);
      const hashedRefreshToken = await bcrypt.hash(refreshToken, SALT_ROUND);

      const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

      const sessionPayload: ICreateSession = {
        id: sessionId,
        user_id: user.id,
        token_hash: hashedRefreshToken,
        expires_at: expiresAt,
      };
      await this.sessionRepository.createSession(client, sessionPayload);
      // Commit transaction
      await client.query('COMMIT');
      transactionStarted = false;

      return { user, workspace, accessToken, refreshToken };
    } catch (error) {
      // Rollback if any operation fails
      if (transactionStarted) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error('Transaction rollback failed:', rollbackError);
        }
      }
      const dbError = error as { code?: string };
      if (dbError.code === '23505') {
        throw new AppError('Email already registered', 409);
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async loginUser(data: IUserLogin): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const client = await this.clientPool.connect();
    try {
      const user: IUserWithPassword | null = await this.userRepository.findUserByEmail(client, data.email);
      if (!user) {
        throw new AppError('Email or password incorrect', 401);
      }
      const isCorrectPassword = await bcrypt.compare(data.password, user.password_hash);
      if (!isCorrectPassword) {
        throw new AppError('Email or password incorrect', 401);
      }

      const sessionId = randomUUID();
      const accessToken = issueAccessToken(user.id);
      const refreshToken = issueRefreshToken(user.id, sessionId);
      const hashedRefreshToken = await bcrypt.hash(refreshToken, SALT_ROUND);

      const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

      const sessionPayload: ICreateSession = {
        id: sessionId,
        user_id: user.id,
        token_hash: hashedRefreshToken,
        expires_at: expiresAt,
      };
      await this.sessionRepository.createSession(client, sessionPayload);
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
        accessToken,
        refreshToken,
      };
    } finally {
      client.release();
    }
  }

  async logout(refreshToken: string) {
    const { userId, sessionId } = verifyRefreshToken(refreshToken);
    const client = await this.clientPool.connect();
    try {
      const session: ISession | null = await this.sessionRepository.findActiveSessionById(client, sessionId);
      if (!session || session.user_id !== userId) {
        throw new AppError('Invalid or expired refresh token', 401);
      }
      const isCorrectRefreshToken = await bcrypt.compare(refreshToken, session.token_hash);
      if (!isCorrectRefreshToken) {
        throw new AppError('Invalid refresh token', 401);
      }
      await this.sessionRepository.revokeSession(client, sessionId);
    } finally {
      client.release();
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const { userId, sessionId } = verifyRefreshToken(refreshToken);
    const client = await this.clientPool.connect();
    let transactionStarted = false;
    try {
      // Start transaction
      await client.query('BEGIN');
      transactionStarted = true;
      // Find active session with the id
      const session: ISession | null = await this.sessionRepository.findActiveSessionById(client, sessionId);
      if (!session || session.user_id !== userId) {
        throw new AppError('Invalid or expired refresh token', 401);
      }
      // compare the session is correct
      const isCorrectRefreshToken = await bcrypt.compare(refreshToken, session.token_hash);
      if (!isCorrectRefreshToken) {
        throw new AppError('Invalid refresh token', 401);
      }
      const newSessionId = randomUUID();
      // Generate new tokens
      const issuedRefreshToken = issueRefreshToken(userId, newSessionId);
      const issuedAccessToken = issueAccessToken(userId);
      // Hash new refresh token
      const hashedRefreshToken = await bcrypt.hash(issuedRefreshToken, SALT_ROUND);

      const expireAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

      const sessionPayload: ICreateSession = {
        id: newSessionId,
        user_id: userId,
        token_hash: hashedRefreshToken,
        expires_at: expireAt,
      };
      // Revoke old session
      const revoked = await this.sessionRepository.revokeSession(client, sessionId);
      if (!revoked) {
        throw new AppError('Session is no longer active', 401);
      }
      // Create new session
      await this.sessionRepository.createSession(client, sessionPayload);
      // Commit transaction
      await client.query('COMMIT');
      transactionStarted = false;
      return {
        accessToken: issuedAccessToken,
        refreshToken: issuedRefreshToken,
      };
    } catch (error) {
      // Rollback if any operation fails
      if (transactionStarted) {
        try {
          await client.query('ROLLBACK');
        } catch (rollbackError) {
          console.error('Transaction rollback failed: ', rollbackError);
        }
      }
      throw error;
    } finally {
      client.release();
    }
  }
}
