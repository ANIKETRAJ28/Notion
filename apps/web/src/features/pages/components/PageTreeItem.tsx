import { ChevronRight, FileText } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import { useWorkspacePages } from '../hooks/use-workspace-pages';
import type { Page } from '../types/page.types';

interface PageTreeItemProps {
  page: Page;
  level?: number;
}

export function PageTreeItem({ page, level = 0 }: PageTreeItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { pageId } = useParams();

  const isActive = pageId === page.id;

  const { data, isPending, isError, refetch } = useWorkspacePages(page.id, isOpen);

  const children = data?.data.pages ?? [];

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center gap-1" style={{ paddingLeft: `${level * 12}px` }}>
        <CollapsibleTrigger
          className="flex size-6 shrink-0 items-center justify-center rounded-md hover:bg-accent"
          aria-label={isOpen ? 'Collapse page' : 'Expand page'}
        >
          <ChevronRight className={`size-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </CollapsibleTrigger>

        <Button
          variant={isActive ? 'secondary' : 'ghost'}
          className="h-8 min-w-0 flex-1 justify-start gap-2 px-2"
          onClick={() => navigate(`/pages/${page.id}`)}
        >
          {page.icon ? <span className="shrink-0">{page.icon}</span> : <FileText className="size-4 shrink-0" />}

          <span className="truncate">{page.title}</span>
        </Button>
      </div>
      <CollapsibleContent>
        <div>
          {isPending && (
            <p
              className="px-3 py-2 text-xs text-muted-foreground"
              style={{ paddingLeft: `${(level + 1) * 12 + 24}px` }}
            >
              Loading...
            </p>
          )}

          {isError && (
            <div className="space-y-1 px-3 py-2" style={{ paddingLeft: `${(level + 1) * 12 + 24}px` }}>
              <p className="text-xs text-destructive">Failed to load pages.</p>

              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Try again
              </Button>
            </div>
          )}

          {!isPending &&
            !isError &&
            children.map((child) => <PageTreeItem key={child.id} page={child} level={level + 1} />)}

          {!isPending && !isError && children.length === 0 && (
            <p
              className="px-3 py-2 text-xs text-muted-foreground"
              style={{ paddingLeft: `${(level + 1) * 12 + 24}px` }}
            >
              No pages yet.
            </p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
