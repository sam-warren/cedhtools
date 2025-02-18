"use client";

import { TrendChart } from "@/components/charts/trend-chart";
import { Matchups } from "@/components/commander/matchups";
import { StatsGrid } from "@/components/commander/stats-grid";
import { TopPilotsTable } from "@/components/commander/top-pilots-table";
import { PageHeader } from "@/components/ui/page-header";
import { commanderData } from "@/lib/mock/commander-data";

export default function CommanderPage() {
  return (
    <div className="space-y-4 mb-8">
      <PageHeader title={commanderData.name} description="Commander performance statistics and analysis" showFilters />

      {/* Stats Overview */}
      <StatsGrid stats={commanderData.stats} />

      {/* Win Rate Chart and Top Pilots */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <TrendChart
            data={commanderData.charts.winRate}
            title="Win Rate"
            dataKey="winRate"
            xAxisKey="date"
            valueFormatter={(value) => `${value.toFixed(1)}%`}
          />
        </div>
        <div className="lg:col-span-2">
          <TopPilotsTable data={commanderData.topPilots} />
        </div>
      </div>

      {/* Popularity Chart and Matchups */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="grid grid-cols-1 gap-6 lg:col-span-2">
          <Matchups bestMatchup={commanderData.matchups.best} worstMatchup={commanderData.matchups.worst} />
        </div>
        <div className="lg:col-span-3">
          <TrendChart
            data={commanderData.charts.popularity}
            title="Popularity Over Time"
            dataKey="popularity"
            xAxisKey="date"
            valueFormatter={(value) => `${value.toFixed(1)}%`}
          />
        </div>
      </div>
    </div>
  );
}
