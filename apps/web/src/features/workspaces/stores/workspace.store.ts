import { create } from 'zustand';

interface WorkspaceState {
  activeWorkspaceId: string | null;
  setActiveWorkspace: (workspaceId: string) => void;
  clearActiveWorkspace: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeWorkspaceId: null,

  setActiveWorkspace: (workspaceId) => {
    set({ activeWorkspaceId: workspaceId });
  },

  clearActiveWorkspace: () => {
    set({ activeWorkspaceId: null });
  },
}));
