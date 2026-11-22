import { LogOut, Settings } from 'lucide-react';
import { Outlet } from 'react-router';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useLogout } from '@/features/auth/hooks/use-auth-mutations';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { CreatePageDialog } from '@/features/pages/components/CreatePageDialog';
import { PageTree } from '@/features/pages/components/PageTree';
import { WorkspaceSwitcher } from '@/features/workspaces/components/workspace-switcher';

export function AppLayout() {
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogout();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
              N
            </div>
            <span className="font-semibold">Notion Clone</span>
          </div>
          <SidebarGroupLabel>Selected Workspace</SidebarGroupLabel>
          <WorkspaceSwitcher />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <CreatePageDialog />
              </SidebarMenu>
              <div className="mt-2">
                <PageTree />
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <Separator />

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" className="w-full justify-start gap-2 px-2" />}>
              <Avatar className="size-8">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>

              <span className="truncate">{user?.name ?? 'My account'}</span>
            </DropdownMenuTrigger>

            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuItem disabled={logoutMutation.isPending} onClick={handleLogout}>
                <LogOut />
                {logoutMutation.isPending ? 'Logging out...' : 'Log out'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          {/* <Separator orientation="vertical" /> */}
          <span className="text-sm text-muted-foreground">My workspace</span>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
