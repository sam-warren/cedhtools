import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="max-w-2xl mb-12">
        <Skeleton className="h-12 w-80 mb-6" />
        <Skeleton className="h-6 w-full max-w-lg" />
      </div>

      {/* Search skeleton */}
      <div className="flex flex-wrap gap-4 mb-4">
        <Skeleton className="h-10 flex-1 min-w-[200px] max-w-md" />
      </div>

      {/* Filters skeleton */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Results count skeleton */}
      <Skeleton className="h-5 w-48 mb-4" />

      {/* Tournament list skeleton */}
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    </div>
  );
}

