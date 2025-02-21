"use client";

import { BarChartComponent } from "@/components/charts/bar-chart";
import { TrendChart } from "@/components/charts/trend-chart";
import { StatsGrid } from "@/components/commander/stats-grid";
import { TopPilotsTable } from "@/components/commander/top-pilots-table";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { commanderData } from "@/lib/mock/commander-data";
import { Layers, ShieldOff, Swords } from "lucide-react";
import Link from "next/link";

export default function CommanderPage() {
  return (
    <div className="mb-8 space-y-4">
      <PageHeader title={commanderData.name} description="Commander performance statistics and analysis">
        <Link
          href={`/commanders/${commanderData.name}/cards`}
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200">
          <Layers />
          View Cards
        </Link>
      </PageHeader>

      {/* Stats Overview */}
      <StatsGrid stats={commanderData.stats} />

      {/* Win Rate Chart and Top Pilots */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <BarChartComponent
            data={commanderData.charts.winRateBySeat}
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
            data={commanderData.charts.winRate}
            title="Win Rate Over Time"
            description="Average commander win rate in tournaments"
            dataKey="winRate"
            xAxisKey="date"
            valueFormatter={(value) => `${value.toFixed(1)}`}
            color="hsl(var(--chart-2))"
            className="h-full"
          />
        </div>
      </div>

      {/* Popularity Chart and Matchups */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="lg:col-span-1">
          <TrendChart
            data={commanderData.charts.popularity}
            title="Popularity Over Time"
            description="Commander popularity in tournaments by meta share percentage"
            tooltipLabel="Popularity"
            dataKey="popularity"
            xAxisKey="date"
            valueFormatter={(value) => `${value.toFixed(1)}`}
            color="hsl(var(--chart-2))"
          />
        </div>
        <div className="lg:col-span-1">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-1">
            <StatCard
              title="Best Matchup"
              value={commanderData.matchups.best.name}
              icon={Swords}
              subtext={`${commanderData.matchups.best.winRate.toFixed(1)}% win rate`}
              textSize="text-2xl"
              valueFormat={(value) => (
                <Link
                  href={`/commanders/${value}`}
                  className="text-inherit hover:underline hover:decoration-zinc-900 dark:hover:decoration-zinc-100">
                  {value}
                </Link>
              )}
            />
            <StatCard
              title="Worst Matchup"
              value={commanderData.matchups.worst.name}
              icon={ShieldOff}
              subtext={`${commanderData.matchups.worst.winRate.toFixed(1)}% win rate`}
              textSize="text-2xl"
              valueFormat={(value) => (
                <Link
                  href={`/commanders/${value}`}
                  className="text-inherit hover:underline hover:decoration-zinc-900 dark:hover:decoration-zinc-100">
                  {value}
                </Link>
              )}
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <TopPilotsTable data={commanderData.topPilots} />
        </div>
        <div className="lg:col-span-2">
          <BarChartComponent
            data={commanderData.charts.winRateByCut}
            title="Win Rate by Top Cut"
            description="Performance based on tournament rounds"
            tooltipLabel="Win Rate"
            dataKey="winRate"
            xAxisKey="cut"
            footerMessage="This deck performs significantly better in Swiss rounds than in top cut."
            footerDescription="This might be an indicator that this deck is better suited for competitive play."
          />{" "}
        </div>
      </div>
    </div>
  );
}
