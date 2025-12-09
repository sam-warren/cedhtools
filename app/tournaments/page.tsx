import { Suspense } from "react";
import { TournamentBrowser } from "@/components/tournaments/tournament-browser";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Tournaments",
  description: "Browse recent cEDH tournament results and standings.",
};

export default function TournamentsPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="max-w-2xl mb-12">
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-6">
          Tournament Results
        </h1>
        <p className="text-lg text-muted-foreground">
          Browse recent competitive EDH tournaments, view standings, and explore
          winning decklists from events worldwide.
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
