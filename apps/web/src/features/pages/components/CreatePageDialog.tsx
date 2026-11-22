import { Plus } from 'lucide-react';
import { type SubmitEvent, useState } from 'react';
import { useParams } from 'react-router';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { useWorkspaceStore } from '@/features/workspaces/stores/workspace.store';

import { useCreatePage } from '../hooks/use-create-page';

export function CreatePageDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [validationError, setValidationError] = useState('');

  const user = useAuthStore((state) => state.user);
  const activeWorkspaceId = useWorkspaceStore((state) => state.activeWorkspaceId);
  const { pageId } = useParams();

  const createPageMutation = useCreatePage();

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      setTitle('');
      setValidationError('');
      createPageMutation.reset();
    }
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!user || !activeWorkspaceId) {
      setValidationError('Select a workspace before creating a page');
      return;
    }

    setValidationError('');

    createPageMutation.mutate(
      {
        title: trimmedTitle || 'Untitled',
        workspace_id: activeWorkspaceId,
        parent_page_id: pageId,
        created_by: user.id,
      },
      {
        onSuccess: () => {
          handleOpenChange(false);
        },
      },
    );
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton onClick={() => setOpen(true)}>
        <Plus />
        <span>Add a page</span>
      </SidebarMenuButton>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a page</DialogTitle>
            <DialogDescription>Give your new page a title to get started.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-2 py-4">
              <Label htmlFor="page-title">Page title</Label>

              <Input
                id="page-title"
                placeholder="Untitled"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                autoFocus
              />

              {validationError && <p className="text-sm text-destructive">{validationError}</p>}

              {createPageMutation.isError && (
                <p className="text-sm text-destructive">
                  {createPageMutation.error.message || 'Failed to create page'}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>

              <Button type="submit" disabled={createPageMutation.isPending}>
                {createPageMutation.isPending ? 'Creating...' : 'Create page'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SidebarMenuItem>
  );
}
