"use client";

import { BarChartComponent } from "@/components/charts/bar-chart";
import { TrendChart } from "@/components/charts/trend-chart";
import { StatsGrid } from "@/components/commander/stats-grid";
import { TopDecklistsTable } from "@/components/commander/top-decklists-table";
import { TopPilotsTable } from "@/components/commander/top-pilots-table";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import type {
  CommanderDetails,
  CommanderStats,
  TopDecklist,
  TopPlayer,
  CommanderWinRateBySeat,
  CommanderWinRateByCut
} from "@/types/entities/commanders";
import { TimeSeriesDataPoint } from "@/types/entities/common";
import { Layers, ThumbsDown, ThumbsUp } from "lucide-react";
import Link from "next/link";

interface Props {
  commander: CommanderDetails;
  stats: CommanderStats;
  matchups: CommanderDetails["matchups"];
  topPlayers: TopPlayer[];
  winRateHistory: TimeSeriesDataPoint[];
  popularityHistory: TimeSeriesDataPoint[];
  winRateBySeat: CommanderWinRateBySeat[];
  winRateByCut: CommanderWinRateByCut[];
  topDecklists: TopDecklist[];
}

export default function CommanderDetailsPage({
  commander,
  stats,
  matchups,
  topPlayers,
  winRateHistory,
  popularityHistory,
  winRateBySeat,
  winRateByCut,
  topDecklists
}: Props) {
  return (
    <div className="space-y-4">
      <PageHeader title={commander.name} description="Commander performance statistics and analysis">
        <Link
          href={`/commanders/${commander.id}/cards`}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200">
          <Layers />
          View Cards
        </Link>
      </PageHeader>

      {/* Stats Overview */}
      <StatsGrid stats={stats} />

      {/* Win Rate Chart and Top Pilots */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <BarChartComponent
            data={winRateBySeat.map((seat: CommanderWinRateBySeat) => ({
              position: seat.position,
              winRate: seat.winRate
            }))}
            title="Win Rate by Seat Position"
            description="Impact of turn order on performance"
            tooltipLabel="Win Rate"
            dataKey="winRate"
            xAxisKey="position"
            footerMessage="This deck performs significantly better in seat 1 than other seats."
            footerDescription="This might be an indicator that this deck wins quickly in early turns."
          />
        </div>
        <div className="lg:col-span-3">
          <TrendChart
            data={winRateHistory.map((point: TimeSeriesDataPoint) => ({
              date: point.timestamp,
              winRate: point.value
            }))}
            title="Win Rate Over Time"
            description="Average commander win rate in tournaments"
            dataKey="winRate"
            xAxisKey="date"
            valueFormatter={(value) => `${value.toFixed(1)}`}
            color="hsl(var(--chart-1))"
            className="h-full"
          />
        </div>
      </div>

      {/* Popularity Chart and Win Rate by Cut */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <TrendChart
            data={popularityHistory.map((point: TimeSeriesDataPoint) => ({
              date: point.timestamp,
              popularity: point.value
            }))}
            title="Popularity Over Time"
            description="Commander popularity in tournaments by meta share percentage"
            tooltipLabel="Popularity"
            dataKey="popularity"
            xAxisKey="date"
            valueFormatter={(value) => `${value.toFixed(1)}`}
            color="hsl(var(--chart-1))"
          />
        </div>
        <div className="lg:col-span-2">
          <BarChartComponent
            data={winRateByCut.map((cut: CommanderWinRateByCut) => ({
              cut: cut.cut,
              winRate: cut.winRate
            }))}
            title="Win Rate by Top Cut"
            description="Performance based on tournament rounds"
            tooltipLabel="Win Rate"
            dataKey="winRate"
            xAxisKey="cut"
            footerMessage="This deck performs significantly better in Swiss rounds than in top cut."
            footerDescription="This might be an indicator that this deck is better suited for competitive play."
          />
        </div>
      </div>

      {/* Matchups Section */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <StatCard
          title="Best Matchup"
          value={matchups.best[0].commander.name}
          icon={ThumbsUp}
          subtext={`${matchups.best[0].winRate.toFixed(1)}% win rate`}
          textSize="text-2xl"
          valueFormat={(value) => (
            <Link
              href={`/commanders/${String(value).toLowerCase().replace(/\s+/g, "-")}`}
              className="text-inherit hover:underline hover:decoration-zinc-900 dark:hover:decoration-zinc-100">
              {value}
            </Link>
          )}
        />
        <StatCard
          title="Worst Matchup"
          value={matchups.worst[0].commander.name}
          icon={ThumbsDown}
          subtext={`${matchups.worst[0].winRate.toFixed(1)}% win rate`}
          textSize="text-2xl"
          valueFormat={(value) => (
            <Link
              href={`/commanders/${String(value).toLowerCase().replace(/\s+/g, "-")}`}
              className="text-inherit hover:underline hover:decoration-zinc-900 dark:hover:decoration-zinc-100">
              {value}
            </Link>
          )}
        />
      </div>
      {/* Top Pilots Table */}
      <TopPilotsTable data={topPlayers} />
      {/* Top Decklists Table */}
      <TopDecklistsTable data={topDecklists} />
    </div>
  );
}
