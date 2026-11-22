import { Skeleton } from '@/components/ui/skeleton';

export function PageLoading() {
  return (
    <div className="flex min-h-[70vh] w-full items-center justify-center p-6">
      <div className="w-full max-w-3xl space-y-8">
        {/* Page header */}
        <div className="space-y-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>

        {/* Editor content */}
        <div className="space-y-5 pt-6">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
          <Skeleton className="h-5 w-4/6" />

          <div className="space-y-3 pt-6">
            <Skeleton className="h-7 w-1/2" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5" />
          </div>

          <div className="space-y-3 pt-6">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}
