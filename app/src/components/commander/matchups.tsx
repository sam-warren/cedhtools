"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ManaCost } from "@/components/icons/mana-symbol";
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Best Matchup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ManaCost cost={bestMatchup.colorIdentity} size={16} />
          <div>
            <Link href={`/commanders/${bestMatchup.name}`} className="text-lg font-semibold hover:underline">
              {bestMatchup.name}
            </Link>
            <p className="text-sm text-muted-foreground">{bestMatchup.winRate.toFixed(1)}% win rate</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Worst Matchup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ManaCost cost={worstMatchup.colorIdentity} size={16} />
          <div>
            <Link href={`/commanders/${worstMatchup.name}`} className="text-lg font-semibold hover:underline">
              {worstMatchup.name}
            </Link>
            <p className="text-sm text-muted-foreground">{worstMatchup.winRate.toFixed(1)}% win rate</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 