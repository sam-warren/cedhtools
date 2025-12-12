"use client";

import { TopPlayersTable } from "@/components/commanders/top-players-table";

interface TopPlayersSectionProps {
  commanderName: string;
}

export function TopPlayersSection({ commanderName }: TopPlayersSectionProps) {
  return (
    <section className="border-t pt-12">
      <div className="mb-6">
        <h2 className="text-lg font-medium">Top Players</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Players ranked by win rate weighted by tournament entries
        </p>
      </div>
      <TopPlayersTable commanderName={commanderName} />
    </section>
  );
}

