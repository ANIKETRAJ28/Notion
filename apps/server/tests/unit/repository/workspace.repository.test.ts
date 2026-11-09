import { PoolClient } from 'pg';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WorkspaceRepository } from '../../../src/repository/workspace.repository';
import { ICreateWorkspace, IWorkspace, IWorkspaceWithMember } from '../../../src/schema/workspace.schema';

const queryMock = vi.fn();

const client = {
  query: queryMock,
} as unknown as PoolClient;

const existingWorkspace: IWorkspace = {
  id: 'workspace-123',
  name: 'Test User Workspace',
  is_personal: true,
  created_by: 'user-123',
  created_at: new Date(),
  updated_at: new Date(),
};

const workspace: ICreateWorkspace = {
  name: 'Test User Workspace',
  is_personal: true,
  created_by: 'user-123',
};

const existingWorkspaceWithMember: IWorkspaceWithMember[] = [
  {
    ...existingWorkspace,
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

const workspaceRepository = new WorkspaceRepository();

describe('WorkspaceRepository - createWorkspace', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should successfully create a workspace', async () => {
    queryMock.mockResolvedValue({
      rows: [existingWorkspace],
      rowCount: 1,
    });

    const result = await workspaceRepository.createWorkspace(client, workspace);

    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO workspaces'), [
      workspace.name,
      workspace.is_personal,
      workspace.created_by,
    ]);

    expect(result).toEqual(existingWorkspace);
  });

  it('should throw an error when database query fails', async () => {
    queryMock.mockRejectedValue(new Error('Database query failed'));

    await expect(workspaceRepository.createWorkspace(client, workspace)).rejects.toThrow('Database query failed');

    expect(queryMock).toHaveBeenCalledOnce();
  });
});

describe('WorkspaceRepository - getUserWorkspaces', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should successfully return all workspaces belonging to a user', async () => {
    queryMock.mockResolvedValue({
      rows: existingWorkspaceWithMember,
      rowCount: 2,
    });

    const result = await workspaceRepository.getUserWorkspaces(client, 'user-123');

    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining('INNER JOIN workspace_members'), ['user-123']);

    expect(result).toEqual(existingWorkspaceWithMember);
  });

  it('should return an empty array when user has no workspaces', async () => {
    queryMock.mockResolvedValue({
      rows: [],
      rowCount: 0,
    });

    const result = await workspaceRepository.getUserWorkspaces(client, 'user-123');

    expect(result).toEqual([]);
    expect(queryMock).toHaveBeenCalledOnce();
  });

  it('should throw an error when database query fails', async () => {
    queryMock.mockRejectedValue(new Error('Database query failed'));

    await expect(workspaceRepository.getUserWorkspaces(client, 'user-123')).rejects.toThrow('Database query failed');
    expect(queryMock).toHaveBeenCalledOnce();
  });
});
