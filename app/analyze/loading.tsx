import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="max-w-2xl space-y-8">
        {/* Header */}
        <div className="mb-8">
          <Skeleton className="h-12 w-64 mb-6" />
          <Skeleton className="h-6 w-full max-w-lg" />
        </div>

        {/* Recent Decks skeleton */}
        <Skeleton className="h-24 w-full" />

        {/* Commander Selection skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Decklist Input skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-[180px] w-full" />
        </div>

        {/* Submit Button skeleton */}
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

