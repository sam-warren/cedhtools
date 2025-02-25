"use client";

import { TrendChart } from "@/components/charts/trend-chart";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import type { PlayerDetails } from "@/services/players";
import { Award, Crown, Handshake, Medal, ScrollText, Swords, Trophy, ThumbsUp, ThumbsDown } from "lucide-react";
import Link from "next/link";

interface Props {
  playerDetails: PlayerDetails;
}

export default function PlayerDetailsPage({ playerDetails }: Props) {
  // Find most played and best performing commanders
  const mostPlayedCommander = [...playerDetails.commanderStats].sort((a, b) => b.games - a.games)[0];
  const topPerformingCommander = [...playerDetails.commanderStats].sort((a, b) => b.winRate - a.winRate)[0];

  const recentTournamentsColumns = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }: { row: { getValue: (key: string) => string } }) => {
        const date = new Date(row.getValue("date"));
        return date.toISOString().split("T")[0];
      }
    },
    {
      accessorKey: "name",
      header: "Tournament",
      cell: ({ row }: { row: { getValue: (key: string) => string; original: { id: string } } }) => (
        <Link href={`/tournaments/${row.original.id}`} className="text-foreground hover:underline">
          {row.getValue("name")}
        </Link>
      )
    },
    {
      accessorKey: "standing",
      header: "Standing"
    },
    {
      accessorKey: "commander",
      header: "Commander",
      cell: ({ row }: { row: { getValue: (key: string) => string } }) => (
        <Link
          href={`/commanders/${row.getValue("commander").toLowerCase().replace(/\s+/g, "-")}`}
          className="text-foreground hover:underline">
          {row.getValue("commander")}
        </Link>
      )
    }
  ];

  const commanderStatsColumns = [
    {
      accessorKey: "name",
      header: "Commander",
      cell: ({ row }: { row: { getValue: (key: string) => string } }) => (
        <Link
          href={`/commanders/${row.getValue("name").toLowerCase().replace(/\s+/g, "-")}`}
          className="text-foreground hover:underline">
          {row.getValue("name")}
        </Link>
      )
    },
    {
      accessorKey: "games",
      header: "Games"
    },
    {
      accessorKey: "winRate",
      header: "Win Rate",
      cell: ({ row }: { row: { getValue: (key: string) => number } }) => `${row.getValue("winRate").toFixed(1)}%`
    }
  ];

  return (
    <div className="space-y-4">
      <PageHeader title={playerDetails.name} description="Player performance statistics and tournament history" />

      <div className="space-y-4">
        {/* Top row - 3 columns */}

        {/* Bottom row - 4 columns */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Tournament Wins"
            value={playerDetails.stats.tournamentWins}
            icon={Trophy}
            subtext={`From ${playerDetails.stats.entries.total} entries`}
            infoTooltip="Number of tournaments won"
          />

          <StatCard
            title="Top 4s"
            value={playerDetails.stats.top4s}
            icon={Medal}
            subtext={`${((playerDetails.stats.top4s / playerDetails.stats.totalGames) * 100).toFixed(1)}% top 4 conversion`}
            infoTooltip="Number of top 4 finishes"
          />

          <StatCard
            title="Top 10s"
            value={playerDetails.stats.top10s}
            icon={Award}
            subtext={`${((playerDetails.stats.top10s / playerDetails.stats.totalGames) * 100).toFixed(1)}% top 10 conversion`}
            infoTooltip="Number of top 10 finishes"
          />

          <StatCard
            title="Top 16s"
            value={playerDetails.stats.top16s}
            icon={Crown}
            subtext={`${((playerDetails.stats.top16s / playerDetails.stats.totalGames) * 100).toFixed(1)}% top 16 conversion`}
            infoTooltip="Number of top 16 finishes"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            title="Tournament Entries"
            value={playerDetails.stats.entries.total}
            icon={ScrollText}
            subtext={"Consistent tournament attendance"}
            infoTooltip="Total number of tournaments entered"
          />

          <StatCard
            title="Average Win Rate"
            value={playerDetails.stats.winRate}
            icon={Award}
            subtext={`Won ${playerDetails.stats.wins} out of ${playerDetails.stats.totalGames} games`}
            valueFormat={(val) => `${Number(val).toFixed(1)}%`}
            infoTooltip="Percentage of games won across all tournament matches"
          />

          <StatCard
            title="Average Draw Rate"
            value={playerDetails.stats.drawRate}
            icon={Handshake}
            subtext={`Drew ${playerDetails.stats.draws} out of ${playerDetails.stats.totalGames} games`}
            valueFormat={(val) => `${Number(val).toFixed(1)}%`}
            infoTooltip="Percentage of games that ended in a draw"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="shadow-sm transition-shadow duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle>Recent Tournaments</CardTitle>
            <CardDescription>Latest tournament results and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={recentTournamentsColumns}
              data={playerDetails.recentTournaments}
              enableRowSelection={false}
              enableViewOptions={false}
            />
          </CardContent>
        </Card>
        <Card className="shadow-sm transition-shadow duration-200 hover:shadow-md">
          <CardHeader>
            <CardTitle>Commander Stats</CardTitle>
            <CardDescription>Performance with different commanders</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={commanderStatsColumns}
              data={playerDetails.commanderStats}
              enableRowSelection={false}
              enableViewOptions={false}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <TrendChart
            data={playerDetails.performanceHistory}
            title="Win Rate Over Time"
            description="Average win rate in tournaments"
            dataKey="winRate"
            xAxisKey="date"
            valueFormatter={(value) => `${value.toFixed(1)}`}
            color="hsl(var(--chart-1))"
            className="min-h-[200px]"
          />
        </div>

        <div className="space-y-4 lg:col-span-2">
          <StatCard
            title="Most Played Deck"
            value={mostPlayedCommander.name}
            icon={Crown}
            subtext={`${mostPlayedCommander.games} games played`}
            textSize="text-2xl"
            valueFormat={(value) => {
              const strValue = String(value);
              return (
                <Link
                  href={`/commanders/${strValue.toLowerCase().replace(/\s+/g, "-")}`}
                  className="text-inherit hover:underline hover:decoration-zinc-900 dark:hover:decoration-zinc-100">
                  {strValue}
                </Link>
              );
            }}
          />
          <StatCard
            title="Top Performing Deck"
            value={topPerformingCommander.name}
            icon={Swords}
            subtext={`${topPerformingCommander.winRate.toFixed(1)}% win rate`}
            textSize="text-2xl"
            valueFormat={(value) => {
              const strValue = String(value);
              return (
                <Link
                  href={`/commanders/${strValue.toLowerCase().replace(/\s+/g, "-")}`}
                  className="text-inherit hover:underline hover:decoration-zinc-900 dark:hover:decoration-zinc-100">
                  {strValue}
                </Link>
              );
            }}
          />
        </div>
      </div>

      {/* Matchups Section */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StatCard
          title="Best Matchup"
          value={playerDetails.matchups.best.name}
          icon={ThumbsUp}
          subtext={`${playerDetails.matchups.best.winRate.toFixed(1)}% win rate over ${playerDetails.matchups.best.games} games`}
          textSize="text-2xl"
          valueFormat={(value) => {
            const strValue = String(value);
            return (
              <Link
                href={`/commanders/${strValue.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-inherit hover:underline hover:decoration-zinc-900 dark:hover:decoration-zinc-100">
                {strValue}
              </Link>
            );
          }}
        />
        <StatCard
          title="Worst Matchup"
          value={playerDetails.matchups.worst.name}
          icon={ThumbsDown}
          subtext={`${playerDetails.matchups.worst.winRate.toFixed(1)}% win rate over ${playerDetails.matchups.worst.games} games`}
          textSize="text-2xl"
          valueFormat={(value) => {
            const strValue = String(value);
            return (
              <Link
                href={`/commanders/${strValue.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-inherit hover:underline hover:decoration-zinc-900 dark:hover:decoration-zinc-100">
                {strValue}
              </Link>
            );
          }}
        />
      </div>
    </div>
  );
}
