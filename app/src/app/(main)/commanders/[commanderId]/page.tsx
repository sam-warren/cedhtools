"use client";

import { TrendChart } from "@/components/charts/trend-chart";
import { Matchups } from "@/components/commander/matchups";
import { StatsGrid } from "@/components/commander/stats-grid";
import { TopPilotsTable } from "@/components/commander/top-pilots-table";
import { PageHeader } from "@/components/ui/page-header";
import { commanderData } from "@/lib/mock/commander-data";

export default function CommanderPage() {
  return (
    <div className="mb-8 space-y-4">
      <PageHeader title={commanderData.name} description="Commander performance statistics and analysis" showFilters />

      {/* Stats Overview */}
      <StatsGrid stats={commanderData.stats} />

      {/* Win Rate Chart and Top Pilots */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="h-full">
            <TrendChart
              data={commanderData.charts.winRate}
              title="Win Rate Over Time"
              tooltipLabel="Win Rate"
              dataKey="winRate"
              xAxisKey="date"
              valueFormatter={(value) => `${value.toFixed(1)}`}
              color="hsl(var(--chart-2))"
              className="w-full"
            />
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="h-full">
            <TopPilotsTable data={commanderData.topPilots} />
          </div>
        </div>
      </div>

      {/* Popularity Chart and Matchups */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-1">
            <Matchups bestMatchup={commanderData.matchups.best} worstMatchup={commanderData.matchups.worst} />
          </div>
        </div>
        <div className="lg:col-span-3">
          <div className="h-full">
            <TrendChart
              data={commanderData.charts.popularity}
              title="Popularity Over Time"
              tooltipLabel="Popularity"
              dataKey="popularity"
              xAxisKey="date"
              valueFormatter={(value) => `${value.toFixed(1)}`}
              color="hsl(var(--chart-2))"
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
