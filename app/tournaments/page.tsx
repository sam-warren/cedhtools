import { Suspense } from "react";
import { TournamentBrowser } from "./tournament-browser";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Tournaments",
  description: "Browse recent cEDH tournament results and standings.",
};

export default function TournamentsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tournament Results</h1>
        <p className="text-muted-foreground">
          Browse recent competitive EDH tournaments, view standings, and explore
          winning decklists.
        </p>
      </div>

      <Suspense fallback={<TournamentsSkeleton />}>
        <TournamentBrowser />
      </Suspense>
    </div>
  );
}

function TournamentsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}


