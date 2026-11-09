import { Pool, PoolClient } from 'pg';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WorkspaceRepository } from '../../../src/repository/workspace.repository';
import { IWorkspaceWithMember } from '../../../src/schema/workspace.schema';
import { WorkspaceService } from '../../../src/service/workspace.service';

const connectMock = vi.fn();
const getUserWorkspacesMock = vi.fn();

const client = {
  release: vi.fn(),
} as unknown as PoolClient;

const clientPool = {
  connect: connectMock,
} as unknown as Pool;

const workspaceRepository = {
  getUserWorkspaces: getUserWorkspacesMock,
} as unknown as WorkspaceRepository;

let workspaceService: WorkspaceService;

const existingWorkspaces: IWorkspaceWithMember[] = [
  {
    id: 'workspace-123',
    name: 'Personal Workspace',
    is_personal: true,
    created_by: 'user-123',
    created_at: new Date(),
    updated_at: new Date(),
    role: 'owner',
    joined_at: new Date(),
  },
  {
    id: 'workspace-456',
    name: 'Project Workspace',
    is_personal: false,
    created_by: 'user-456',
    created_at: new Date(),
    updated_at: new Date(),
    role: 'member',
    joined_at: new Date(),
  },
];

describe('WorkspaceService - getUserWorkspaces', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    connectMock.mockResolvedValue(client);
    workspaceService = new WorkspaceService(workspaceRepository, clientPool);
  });

  it('should successfully return all workspaces belonging to a user', async () => {
    getUserWorkspacesMock.mockResolvedValue(existingWorkspaces);

    const result = await workspaceService.getUserWorkspaces('user-123');

    expect(getUserWorkspacesMock).toHaveBeenCalledWith(client, 'user-123');
    expect(result).toEqual(existingWorkspaces);
    expect(connectMock).toHaveBeenCalledOnce();
    expect(client.release).toHaveBeenCalledOnce();
  });

  it('should return an empty array when user has no workspaces', async () => {
    getUserWorkspacesMock.mockResolvedValue([]);

    const result = await workspaceService.getUserWorkspaces('user-123');

    expect(result).toEqual([]);
    expect(getUserWorkspacesMock).toHaveBeenCalledOnce();
    expect(client.release).toHaveBeenCalledOnce();
  });

  it('should release database client when repository query fails', async () => {
    getUserWorkspacesMock.mockRejectedValue(new Error('Database query failed'));

    await expect(workspaceService.getUserWorkspaces('user-123')).rejects.toThrow('Database query failed');

    expect(getUserWorkspacesMock).toHaveBeenCalledOnce();
    expect(connectMock).toHaveBeenCalledOnce();
    expect(client.release).toHaveBeenCalledOnce();
  });

  it('should propagate error when database connection fails', async () => {
    connectMock.mockRejectedValue(new Error('Database connection failed'));

    await expect(workspaceService.getUserWorkspaces('user-123')).rejects.toThrow('Database connection failed');

    expect(connectMock).toHaveBeenCalledOnce();
    expect(getUserWorkspacesMock).not.toHaveBeenCalled();
    expect(client.release).not.toHaveBeenCalled();
  });
});
