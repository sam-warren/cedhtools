import { Suspense } from "react";
import { CommanderBrowser } from "./commander-browser";
import { CommanderCardSkeleton } from "@/components/commander-card";

export const metadata = {
  title: "Commanders",
  description: "Browse cEDH commanders by conversion rate, popularity, and color identity.",
};

export default function CommandersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Commander Statistics</h1>
        <p className="text-muted-foreground">
          Browse cEDH commanders ranked by tournament performance. Filter by
          color identity and sort by conversion rate, popularity, or top cuts.
        </p>
      </div>

      <Suspense fallback={<CommanderBrowserSkeleton />}>
        <CommanderBrowser />
      </Suspense>
    </div>
  );
}

function CommanderBrowserSkeleton() {
  return (
    <div>
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


