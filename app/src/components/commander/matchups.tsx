"use client";

import { StatCard } from "@/components/ui/stat-card";
import { Swords, ShieldOff } from "lucide-react";
import Link from "next/link";

interface Matchup {
  name: string;
  colorIdentity: string;
  winRate: number;
}

interface MatchupsProps {
  bestMatchup: Matchup;
  worstMatchup: Matchup;
}

export function Matchups({ bestMatchup, worstMatchup }: MatchupsProps) {
  return (
    <>
      <StatCard
        title="Best Matchup"
        value={bestMatchup.name}
        icon={Swords}
        subtext={`${bestMatchup.winRate.toFixed(1)}% win rate`}
        valueFormat={(value) => (
          <Link href={`/commanders/${value}`} className="hover:underline">
            {value}
          </Link>
        )}
      />
      <StatCard
        title="Worst Matchup"
        value={worstMatchup.name}
        icon={ShieldOff}
        subtext={`${worstMatchup.winRate.toFixed(1)}% win rate`}
        valueFormat={(value) => (
          <Link href={`/commanders/${value}`} className="hover:underline">
            {value}
          </Link>
        )}
      />
    </>
  );
} 