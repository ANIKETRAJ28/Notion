import { Check, ChevronsUpDown } from 'lucide-react';
import { useEffect } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';

import { useWorkspace } from '../hooks/use-workspaces';
import { useWorkspaceStore } from '../stores/workspace.store';

export function WorkspaceSwitcher() {
  const { data, isPending, isError } = useWorkspace();

  const workspaces = data?.data.workspaces ?? [];

  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const setActiveWorkspace = useWorkspaceStore((state) => state.setActiveWorkspace);
  const clearActiveWorkspace = useWorkspaceStore((state) => state.clearActiveWorkspace);

  useEffect(() => {
    if (isPending || isError) {
      return;
    }

    if (workspaces.length === 0) {
      clearActiveWorkspace();
      return;
    }

    const activeWorkspaceExists = workspaces.some((workspace) => workspace.id === activeWorkspaceId);
    if (!activeWorkspaceExists) {
      setActiveWorkspace(workspaces[0].id);
    }
  }, [workspaces, activeWorkspaceId, isPending, isError, setActiveWorkspace, clearActiveWorkspace]);

  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId);

  if (isPending) {
    return <p className="px-2 py-2 text-sm text-muted-foreground">Loading workspaces...</p>;
  }

  if (isError) {
    return <p className="px-2 py-2 text-sm text-destructive">Unable to load workspaces.</p>;
  }

  if (workspaces.length === 0) {
    return <p className="px-2 py-2 text-sm text-muted-foreground">No workspaces found.</p>;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton className="w-full">
                <span className="truncate">{activeWorkspace?.name ?? 'Select workspace'}</span>
                <ChevronsUpDown className="ml-auto" />
              </SidebarMenuButton>
            }
          />

          <DropdownMenuContent align="start" className="w-56">
            {workspaces.map((workspace) => (
              <DropdownMenuItem key={workspace.id} onClick={() => setActiveWorkspace(workspace.id)}>
                <span className="truncate">{workspace.name}</span>

                {workspace.id === activeWorkspaceId && <Check className="ml-auto" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
