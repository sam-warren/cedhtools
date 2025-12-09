import { CommanderCardSkeleton } from "@/components/shared/commander-card";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="h-8 w-64 bg-muted rounded animate-pulse mb-2" />
        <div className="h-5 w-96 bg-muted rounded animate-pulse" />
      </div>

      {/* Filters skeleton */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="h-10 w-40 bg-muted rounded-md animate-pulse" />
        <div className="h-10 w-40 bg-muted rounded-md animate-pulse" />
        <div className="h-10 w-32 bg-muted rounded-md animate-pulse" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(12)].map((_, i) => (
          <CommanderCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}


