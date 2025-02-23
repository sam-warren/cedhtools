import { Skeleton } from "@/components/ui/skeleton";

export default function CommanderLoading() {
  return (
    <div className="mb-8 space-y-4">
      {/* Page Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
        <Skeleton className="h-9 w-[120px] rounded-lg" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="space-y-4">
        {/* Top row - 3 columns */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={`top-${i}`} className="rounded-lg border p-4 py-8">
              <Skeleton className="mb-2 h-4 w-[100px]" />
              <Skeleton className="h-8 w-[120px]" />
              <Skeleton className="mt-2 h-4 w-[140px]" />
            </div>
          ))}
        </div>

        {/* Bottom row - 4 columns */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={`bottom-${i}`} className="rounded-lg border p-4 py-8">
              <Skeleton className="mb-2 h-4 w-[100px]" />
              <Skeleton className="h-8 w-[120px]" />
              <Skeleton className="mt-2 h-4 w-[140px]" />
            </div>
          ))}
        </div>
      </div>

      {/* Win Rate Chart and Top Pilots */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Skeleton className="h-[300px] rounded-lg" />
        </div>
        <div className="lg:col-span-3">
          <Skeleton className="h-[300px] rounded-lg" />
        </div>
      </div>

      {/* Popularity Chart and Matchups */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="lg:col-span-1">
          <Skeleton className="h-[245px] rounded-lg" />
        </div>
        <div className="lg:col-span-1">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-1">
            {/* Best Matchup Card */}
            <div className="rounded-lg border p-4">
              <Skeleton className="mb-2 h-4 w-[100px]" />
              <Skeleton className="mb-2 h-8 w-[180px]" />
              <Skeleton className="h-4 w-[120px]" />
            </div>
            {/* Worst Matchup Card */}
            <div className="rounded-lg border p-4">
              <Skeleton className="mb-2 h-4 w-[100px]" />
              <Skeleton className="mb-2 h-8 w-[180px]" />
              <Skeleton className="h-4 w-[120px]" />
            </div>
          </div>
        </div>
      </div>

      {/* Top Pilots Table and Win Rate by Cut */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="rounded-lg border">
            <div className="p-4 pb-8">
              <Skeleton className="mb-6 h-6 w-[150px]" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 py-2">
                  <Skeleton className="h-4 w-[300px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <Skeleton className="h-[256px] rounded-lg" />
        </div>
      </div>
    </div>
  );
}
