"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCommanderTopPlayers } from "@/hooks/use-queries";
import { useTimePeriod } from "@/lib/contexts/time-period-context";
import { ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";

interface TopPlayersTableProps {
  commanderName: string;
}

function TopPlayersTableSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function TopPlayersTable({ commanderName }: TopPlayersTableProps) {
  const { timePeriod } = useTimePeriod();
  const {
    data,
    isLoading,
    isFetching,
  } = useCommanderTopPlayers(commanderName, timePeriod);

  const topPlayers = data?.top_players ?? [];

  if (isLoading) {
    return <TopPlayersTableSkeleton />;
  }

  if (topPlayers.length === 0) {
    return (
      <p className="text-muted-foreground py-4 text-sm">
        No player data available for this time period.
      </p>
    );
  }

  return (
    <div className={isFetching && !isLoading ? "opacity-60 transition-opacity" : ""}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Player</TableHead>
            <TableHead className="text-right w-[80px]">Entries</TableHead>
            <TableHead className="text-right w-[80px]">Games</TableHead>
            <TableHead className="text-right w-[120px]">Record</TableHead>
            <TableHead className="text-right w-[100px]">Win Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topPlayers.map((player) => (
            <TableRow key={player.player_id}>
              <TableCell className="font-medium">
                {player.topdeck_id ? (
                  <Link
                    href={`https://topdeck.gg/profile/${player.topdeck_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
                  >
                    {player.player_name}
                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                  </Link>
                ) : (
                  <span>{player.player_name}</span>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {player.entries}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {player.games_played}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                <span className="text-green-600 dark:text-green-400">{player.wins}</span>
                <span className="text-muted-foreground">-</span>
                <span className="text-red-600 dark:text-red-400">{player.losses}</span>
                <span className="text-muted-foreground">-</span>
                <span className="text-muted-foreground">{player.draws}</span>
              </TableCell>
              <TableCell className="text-right tabular-nums font-medium">
                {(player.win_rate * 100).toFixed(1)}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {isFetching && !isLoading && (
        <div className="flex justify-center py-2">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

