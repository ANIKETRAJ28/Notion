import { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WorkspaceController } from '../../../src/controller/workspace.controller';
import { IWorkspaceWithMember } from '../../../src/schema/workspace.schema';
import { WorkspaceService } from '../../../src/service/workspace.service';

const getUserWorkspacesMock = vi.fn();

const workspaceService = {
  getUserWorkspaces: getUserWorkspacesMock,
} as unknown as WorkspaceService;

const statusMock = vi.fn();
const jsonMock = vi.fn();
const nextMock = vi.fn() as unknown as NextFunction;

const responseMock = {
  status: statusMock,
  json: jsonMock,
} as unknown as Response;

const requestMock = (userId?: string) => ({ user: userId ? { id: userId } : undefined }) as unknown as Request;

const workspaces: IWorkspaceWithMember[] = [
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
];

let workspaceController: WorkspaceController;

describe('WorkspaceController - getUserWorkspaces', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    statusMock.mockReturnValue(responseMock);
    jsonMock.mockReturnValue(responseMock);
    workspaceController = new WorkspaceController(workspaceService);
  });

  it('should successfully fetch user workspaces', async () => {
    getUserWorkspacesMock.mockResolvedValue(workspaces);

    await workspaceController.getUserWorkspaces(requestMock('user-123'), responseMock, nextMock);

    expect(getUserWorkspacesMock).toHaveBeenCalledWith('user-123');
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: 'Workspaces fetched successfully',
      data: { workspaces },
    });
    expect(nextMock).not.toHaveBeenCalledOnce();
  });

  it('should return an empty workspace array when user has no workspaces', async () => {
    getUserWorkspacesMock.mockResolvedValue([]);

    await workspaceController.getUserWorkspaces(requestMock('user-123'), responseMock, nextMock);

    expect(getUserWorkspacesMock).toHaveBeenCalledWith('user-123');
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: 'Workspaces fetched successfully',
      data: {
        workspaces: [],
      },
    });
  });

  it('should forward authentication error when user ID is missing', async () => {
    await workspaceController.getUserWorkspaces(requestMock(), responseMock, nextMock);

    expect(getUserWorkspacesMock).not.toHaveBeenCalled();
    expect({
      message: 'Authentication required',
      statusCode: 401,
    });
  });

  it('should forward service errors to error-handling middleware', async () => {
    const error = new Error('Failed to fetch workspaces');

    getUserWorkspacesMock.mockRejectedValue(error);

    await workspaceController.getUserWorkspaces(requestMock('user-123'), responseMock, nextMock);

    expect(getUserWorkspacesMock).toHaveBeenCalledWith('user-123');
    expect(nextMock).toHaveBeenCalledWith(error);
  });
});
