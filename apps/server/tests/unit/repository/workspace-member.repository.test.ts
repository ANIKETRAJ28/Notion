import { PoolClient } from 'pg';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WorkspaceMemberRepository } from '../../../src/repository/workspace-member.repository';
import { ICreateWorkspaceMember } from '../../../src/schema/workspace-member.schema';

const queryMock = vi.fn();

const client = {
  query: queryMock,
} as unknown as PoolClient;

const workspaceMember: ICreateWorkspaceMember = {
  workspace_id: 'workspace-123',
  user_id: 'user-123',
  role: 'owner',
};

const workspaceMemberRepository = new WorkspaceMemberRepository();

describe('WorkSpaceMemberRepository - createWorkspaceMember', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should successfully create a workspace member', async () => {
    queryMock.mockResolvedValue({
      rows: [],
      rowCount: 1,
    });

    await workspaceMemberRepository.createWorkspaceMember(client, workspaceMember);

    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO workspace_members'), [
      workspaceMember.workspace_id,
      workspaceMember.user_id,
      workspaceMember.role,
    ]);
    expect(queryMock).toHaveBeenCalledOnce();
  });

  it('should throw an error when database insertion fails', async () => {
    queryMock.mockRejectedValue(new Error('Database insertion failed'));

    await expect(workspaceMemberRepository.createWorkspaceMember(client, workspaceMember)).rejects.toThrow(
      'Database insertion failed',
    );
    expect(queryMock).toHaveBeenCalledOnce();
  });
});
