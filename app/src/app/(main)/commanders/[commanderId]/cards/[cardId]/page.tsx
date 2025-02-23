"use client";

import { BarChartComponent } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { RadialChartComponent } from "@/components/charts/radial-chart";
import { TrendChart } from "@/components/charts/trend-chart";
import { StatsGrid } from "@/components/commander/stats-grid";
import { TopPilotsTable } from "@/components/commander/top-pilots-table";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { commanderData } from "@/lib/mock/commander-data";
import { ShieldOff, Swords } from "lucide-react";
import Link from "next/link";

export default function CommanderPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Basalt Monolith" description="Statistics in Kinnan, Bonder Prodigy decks" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
        <div className="col-span-4">
          <TrendChart
            data={commanderData.charts.winRate}
            title="Win Rate Over Time"
            description="Average commander win rate in tournaments"
            dataKey="winRate"
            xAxisKey="date"
            valueFormatter={(value) => `${value.toFixed(1)}`}
            color="hsl(var(--chart-1))"
            className="min-h-[300px] w-full"
          />
        </div>
        <div className="col-span-2">
          <RadialChartComponent />
        </div>
      </div>
      <div className="grid grid-cols-6 gap-4">
        <div className="col-span-2">
          <DonutChart />
        </div>
        <div className="col-span-4">
          <TrendChart
            data={commanderData.charts.popularity}
            title="Popularity Over Time"
            description="Commander popularity in tournaments by meta share percentage"
            tooltipLabel="Popularity"
            dataKey="popularity"
            xAxisKey="date"
            valueFormatter={(value) => `${value.toFixed(1)}`}
            color="hsl(var(--chart-1))"
            className="min-h-[300px] w-full"
          />
        </div>
      </div>
    </div>
  );
}
