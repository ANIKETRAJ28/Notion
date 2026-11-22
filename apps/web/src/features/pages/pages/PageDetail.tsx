import { useParams } from 'react-router';

import { usePage } from '../hooks/use-page';

export function PageDetailPage() {
  const { pageId } = useParams();
  const { data, isPending, isError } = usePage(pageId);

  if (isPending) {
    return <div className="p-8 text-sm text-muted-foreground">Loading page...</div>;
  }

  if (isError || !data?.data.page) {
    return (
      <div className="p-8 text-sm text-destructive">
        Failed to load page. It may have been deleted or you may not have permission to view it.
      </div>
    );
  }

  const page = data.data.page;

  return (
    <div className="mx-auto w-full max-w-4xl px-8 py-12">
      {page.cover_url && <img src={page.cover_url} alt="" className="mb-8 h-48 w-full rounded-lg object-cover" />}

      <div className="mb-4 text-4xl">{page.icon || '📄'}</div>

      <h1 className="text-3xl font-bold">{page.title}</h1>
    </div>
  );
}
