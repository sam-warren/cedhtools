"use client";

import type { ChartDataPoint, PopularityDataPoint } from "@/types/api/commanders";
import type { CardStats, CardDistribution } from "@/services/commanders";
import { PageHeader } from "@/components/ui/page-header";

// Import the chart components directly
import { DonutChart } from "@/components/charts/donut-chart";
import { RadialChart } from "@/components/charts/radial-chart";
import { TrendChart } from "@/components/charts/trend-chart";

interface Props {
  cardStats: CardStats;
  distribution: CardDistribution[];
  winRateHistory: ChartDataPoint[];
  popularityHistory: PopularityDataPoint[];
  commanderName: string;
}

export default function CommanderCardDetailsPage({
  cardStats,
  distribution,
  winRateHistory,
  popularityHistory,
  commanderName
}: Props) {
  return (
    <div className="space-y-6">
      <PageHeader title={cardStats.name} description={`Statistics in ${commanderName} decks`} />

      {/* First row - Card Distribution and Card Performance side by side */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <DonutChart
            data={distribution}
            title="Card Distribution"
            description="Where the card appears"
            valueKey="metaShare"
            centerLabel="Share %"
            footerMessage="Based on deck composition"
            className="min-h-[320px]"
          />
        </div>
        <div className="lg:col-span-3">
          <RadialChart
            data={cardStats}
            title="Card Performance"
            description="Current win rate with card"
            valueKey="winRate"
            maxValue={100}
            centerLabel="Win Rate %"
            footerMessage="Based on tournament data"
            className="min-h-[320px]"
          />
        </div>
      </div>
      
      {/* Second row - Win Rate and Popularity trends */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <TrendChart
            data={winRateHistory}
            title="Win Rate Over Time"
            description="Average commander win rate in tournaments"
            dataKey="winRate"
            xAxisKey="date"
            valueFormatter={(value) => `${value.toFixed(1)}`}
            color="hsl(var(--chart-1))"
            className="min-h-[320px] w-full"
          />
        </div>
        <div className="lg:col-span-2">
          <TrendChart
            data={popularityHistory}
            title="Popularity Over Time"
            description="Commander popularity in tournaments by meta share percentage"
            tooltipLabel="Popularity"
            dataKey="popularity"
            xAxisKey="date"
            valueFormatter={(value) => `${value.toFixed(1)}`}
            color="hsl(var(--chart-1))"
            className="min-h-[320px] w-full"
          />
        </div>
      </div>
    </div>
  );
}
