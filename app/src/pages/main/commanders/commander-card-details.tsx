"use client";

import { DonutChart } from "@/components/charts/donut-chart";
import { RadialChart } from "@/components/charts/radial-chart";
import { TrendChart } from "@/components/charts/trend-chart";
import { PageHeader } from "@/components/ui/page-header";
import type { ChartDataPoint, PopularityDataPoint } from "@/types/api/commanders";
import type { CardStats, CardDistribution } from "@/services/commanders";

interface Props {
  cardStats: CardStats;
  distribution: CardDistribution[];
  winRateHistory: ChartDataPoint[];
  popularityHistory: PopularityDataPoint[];
}

export default function CommanderCardDetailsPage({
  cardStats,
  distribution,
  winRateHistory,
  popularityHistory
}: Props) {
  return (
    <div className="space-y-4">
      <PageHeader title={cardStats.name} description="Statistics in Kinnan, Bonder Prodigy decks" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-6">
        <div className="col-span-4">
          <TrendChart
            data={winRateHistory}
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
          <RadialChart
            data={cardStats}
            title="Card Performance"
            description="Current win rate with card"
            valueKey="winRate"
            maxValue={100}
            centerLabel="Win Rate %"
            footerMessage="Based on tournament data"
            className="h-full"
          />
        </div>
      </div>
      <div className="grid grid-cols-6 gap-4">
        <div className="col-span-2">
          <DonutChart
            data={distribution}
            title="Card Distribution"
            description="Where the card appears"
            valueKey="metaShare"
            centerLabel="Share %"
            footerMessage="Based on deck composition"
            className="h-full"
          />
        </div>
        <div className="col-span-4">
          <TrendChart
            data={popularityHistory}
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
