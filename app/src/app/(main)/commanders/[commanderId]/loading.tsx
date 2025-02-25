import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/ui/page-header";

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* PageHeader skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-80" />
      </div>

      {/* Commander stats grid skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <div className="mt-4">
              <Skeleton className="h-9 w-16" />
            </div>
            <Skeleton className="mt-2 h-4 w-full" />
          </div>
        ))}
      </div>

      {/* Winrate and Popularity trend charts skeletons */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="h-[300px]">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="h-[300px]">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </div>

      {/* Win rate by seat and win rate by cut skeletons */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4">
            <Skeleton className="h-5 w-36" />
          </div>
          <div className="h-[300px]">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4">
            <Skeleton className="h-5 w-36" />
          </div>
          <div className="h-[300px]">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </div>

      {/* Top pilots and decklists skeletons */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="p-6 pb-2">
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-t">
                <Skeleton className="h-5 w-40" />
                <div className="flex space-x-4">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="p-6 pb-2">
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-t">
                <Skeleton className="h-5 w-48" />
                <div className="flex space-x-4">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
