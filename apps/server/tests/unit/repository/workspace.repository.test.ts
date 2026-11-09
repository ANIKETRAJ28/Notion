import { PoolClient } from 'pg';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WorkspaceRepository } from '../../../src/repository/workspace.repository';
import { ICreateWorkspace, IWorkspace } from '../../../src/schema/workspace.schema';

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

const personalWorkspace: ICreateWorkspace = {
  name: 'Test User Workspace',
  is_personal: true,
  created_by: 'user-123',
};

const workspaceRepository = new WorkspaceRepository();

describe('WorkspaceRepository - createPersonalWorkspace', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should successfully create a personal workspace', async () => {
    queryMock.mockResolvedValue({
      rows: [existingWorkspace],
      rowCount: 1,
    });

    const result = await workspaceRepository.createWorkspace(client, personalWorkspace);

    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO workspaces'), [
      personalWorkspace.name,
      personalWorkspace.is_personal,
      personalWorkspace.created_by,
    ]);

    expect(result).toEqual(existingWorkspace);
  });

  it('should throw an error when database query fails', async () => {
    queryMock.mockRejectedValue(new Error('Database query failed'));

    await expect(workspaceRepository.createWorkspace(client, personalWorkspace)).rejects.toThrow(
      'Database query failed',
    );

    expect(queryMock).toHaveBeenCalledOnce();
  });
});
