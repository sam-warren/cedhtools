"use client";

import { TrendChart } from "@/components/charts/trend-chart";
import { Matchups } from "@/components/commander/matchups";
import { StatsGrid } from "@/components/commander/stats-grid";
import { TopPilotsTable } from "@/components/commander/top-pilots-table";
import { PageHeader } from "@/components/ui/page-header";
import { commanderData } from "@/lib/mock/commander-data";

export default function CommanderPage() {
  return (
    <div className="space-y-6">
      <PageHeader title={commanderData.name} description="Commander performance statistics and analysis" showFilters />

      <section>
        <h2 className="mb-4 text-2xl font-semibold">Overview</h2>
        <StatsGrid stats={commanderData.stats} />
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold">Trends</h2>
        <div className="grid gap-6">
          {/* Win Rate Trend */}
          <TrendChart
            data={commanderData.charts.winRate}
            title="Win Rate Over Time"
            dataKey="winRate"
            xAxisKey="date"
            valueFormatter={(value) => `${value.toFixed(1)}%`}
          />

          {/* Popularity Trend */}
          <TrendChart
            data={commanderData.charts.popularity}
            title="Popularity Over Time"
            dataKey="popularity"
            xAxisKey="date"
            valueFormatter={(value) => `${value.toFixed(1)}%`}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold">Matchup Analysis</h2>
        <Matchups bestMatchup={commanderData.matchups.best} worstMatchup={commanderData.matchups.worst} />
      </section>

      <section>
        <h2 className="mb-4 text-2xl font-semibold">Player Performance</h2>
        <TopPilotsTable data={commanderData.topPilots} />
      </section>
    </div>
  );
}
