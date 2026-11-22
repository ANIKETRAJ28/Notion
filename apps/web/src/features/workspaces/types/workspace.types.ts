export type WorkspaceRole = 'owner' | 'admin' | 'member';

export interface Workspace {
  id: string;
  name: string;
  is_personal: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  role: WorkspaceRole;
  joined_at?: string;
}

export interface GetWorkspacesResponse {
  success: boolean;
  message: string;
  data: {
    workspaces: Workspace[];
  };
}
