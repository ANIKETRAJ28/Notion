import { Button } from '@/components/ui/button';

import { useWorkspacePages } from '../hooks/use-workspace-pages';
import { PageTreeItem } from './PageTreeItem';

export function PageTree() {
  const { data, isPending, isError, refetch } = useWorkspacePages(null);

  if (isPending) {
    return <p className="px-3 py-2 text-sm text-muted-foreground">Loading pages...</p>;
  }

  if (isError) {
    return (
      <div className="space-y-2 px-3 py-2">
        <p className="text-sm text-destructive">Failed to load pages.</p>

        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const pages = data.data.pages;

  if (pages.length === 0) {
    return <p className="px-3 py-2 text-sm text-muted-foreground">No pages yet.</p>;
  }

  return (
    <div className="space-y-1">
      {pages.map((page) => (
        <PageTreeItem key={page.id} page={page} />
      ))}
    </div>
  );
}
