"use client";

import { ColorIdentity } from "@/components/color-identity";
import { ManaCost } from "@/components/shared/mana-cost";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCardCommanderStats } from "@/hooks/use-queries";
import { TIME_PERIOD_OPTIONS, getMonthsToShow, isValidDataMonth, formatMonthLabel, type TimePeriod } from "@/lib/time-period";
import {
  Loader2,
  RefreshCw,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";

interface CardCommanderDetailProps {
  cardName: string;
  commanderId: string;
}


function CardCommanderDetailSkeleton() {
  return (
    <div className="space-y-12">
      <div className="flex flex-col lg:flex-row gap-10">
        <Skeleton className="w-44 aspect-[488/680] rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-6">
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-10 w-72" />
          </div>
          <div className="flex gap-12">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export function CardCommanderDetail({ cardName, commanderId }: CardCommanderDetailProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("6_months");
  
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useCardCommanderStats(cardName, commanderId, timePeriod);

  if (isLoading) {
    return <CardCommanderDetailSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-6">
          {error instanceof Error ? error.message : "Data not found"}
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Link href="/commanders">
            <Button variant="outline">Back to Commanders</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { card, commander, stats, commander_win_rate, trend, play_rate_trend } = data;

  const playRatePercent = (stats.play_rate * 100).toFixed(1);
  const winRatePercent = (stats.win_rate * 100).toFixed(1);
  const commanderWinRatePercent = (commander_win_rate * 100).toFixed(1);
  const conversionScore = Math.round(stats.conversion_score);
  
  // Calculate win rate delta (compare after rounding to avoid "22.4% is below 22.4%")
  const winRateDelta = stats.win_rate - commander_win_rate;
  const winRateDeltaPercent = (winRateDelta * 100).toFixed(2);
  const roundedWinRate = parseFloat(winRatePercent);
  const roundedCommanderWinRate = parseFloat(commanderWinRatePercent);
  const winRateComparison = roundedWinRate > roundedCommanderWinRate ? "above" 
    : roundedWinRate < roundedCommanderWinRate ? "below" 
    : "at";

  // Scryfall image URL
  const cardImageUrl = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(card.name)}&format=image&version=normal`;

  const monthsToShow = getMonthsToShow(timePeriod);

  // Aggregate weekly data to monthly for charts
  const aggregateToMonthly = <T extends { week_start: string }>(
    weeklyData: T[],
    getValue: (item: T) => { value: number; weight: number }
  ) => {
    const monthlyMap = new Map<string, { monthKey: string; label: string; totalValue: number; totalWeight: number }>();
    
    for (const item of weeklyData) {
      const date = new Date(item.week_start);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = formatMonthLabel(date);
      
      const { value, weight } = getValue(item);
      const existing = monthlyMap.get(monthKey) || { monthKey, label, totalValue: 0, totalWeight: 0 };
      existing.totalValue += value * weight;
      existing.totalWeight += weight;
      monthlyMap.set(monthKey, existing);
    }
    
    // Filter to show only complete months (exclude current month and data before start date)
    const completeMonths = Array.from(monthlyMap.values())
      .filter((data) => isValidDataMonth(data.monthKey))
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    
    const displayMonths = monthsToShow !== null 
      ? completeMonths.slice(-monthsToShow)
      : completeMonths;
    
    return displayMonths.map((data) => ({
      month: data.label,
      value: data.totalWeight > 0 ? data.totalValue / data.totalWeight : 0,
      weight: data.totalWeight,
    }));
  };

  // Process trend data for win rate chart (weighted by entries)
  const winRateChartData = trend && trend.length > 0
    ? aggregateToMonthly(trend, (item) => {
        return { value: item.win_rate * 100, weight: item.entries };
      }).map(d => ({ month: d.month, winRate: d.value, entries: d.weight }))
    : [];

  // Process play rate trend data (weighted average of play rate per month)
  const playRateChartData = play_rate_trend && play_rate_trend.length > 0
    ? (() => {
        const monthlyMap = new Map<string, { monthKey: string; label: string; entries: number; commanderEntries: number }>();
        for (const item of play_rate_trend) {
          const date = new Date(item.week_start);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const label = formatMonthLabel(date);
          const existing = monthlyMap.get(monthKey) || { monthKey, label, entries: 0, commanderEntries: 0 };
          existing.entries += item.entries;
          existing.commanderEntries += item.commander_entries;
          monthlyMap.set(monthKey, existing);
        }
        
        // Filter to show only complete months (exclude current month and data before start date)
        const completeMonths = Array.from(monthlyMap.values())
          .filter((data) => isValidDataMonth(data.monthKey))
          .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
        
        const displayMonths = monthsToShow !== null 
          ? completeMonths.slice(-monthsToShow)
          : completeMonths;
        
        return displayMonths.map((data) => ({ 
          month: data.label, 
          playRate: data.commanderEntries > 0 ? (data.entries / data.commanderEntries) * 100 : 0,
          entries: data.entries,
          commanderEntries: data.commanderEntries,
        }));
      })()
    : [];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="flex flex-col lg:flex-row gap-10">
        {/* Card Image */}
        <div className="flex-shrink-0">
          <div className="relative w-44 aspect-[488/680] rounded-lg overflow-hidden shadow-2xl bg-muted">
            <Image
              src={cardImageUrl}
              alt={card.name}
              fill
              className="object-cover"
              priority
              unoptimized
            />
          </div>
        </div>

        {/* Card Info */}
        <div className="flex-1 space-y-8">
          <div>
            {card.type_line && (
              <p className="text-sm text-muted-foreground mb-1">{card.type_line}</p>
            )}
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-3xl md:text-4xl font-medium tracking-tight">{card.name}</h1>
              {card.mana_cost && <ManaCost cost={card.mana_cost} size="lg" />}
              {isFetching && !isLoading && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Statistics in</span>
              <Link
                href={`/commanders/${encodeURIComponent(commander.name)}`}
                className="text-sm font-medium hover:underline"
              >
                {commander.name}
              </Link>
              <ColorIdentity colorId={commander.color_id} size="sm" />
            </div>
          </div>

          {/* Stats - Clean inline layout */}
          <div className={`flex flex-wrap gap-x-12 gap-y-4 ${isFetching && !isLoading ? "opacity-60" : ""} transition-opacity`}>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Play Rate</p>
              <p className="text-2xl font-medium tabular-nums">{playRatePercent}%</p>
              <p className="text-xs text-muted-foreground">{stats.entries} decks</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Win Rate</p>
              <p className={`text-2xl font-medium tabular-nums ${roundedWinRate > roundedCommanderWinRate ? "stat-positive" : roundedWinRate < roundedCommanderWinRate ? "stat-negative" : ""}`}>
                {winRatePercent}%
              </p>
              <p className={`text-xs tabular-nums ${winRateDelta > 0.005 ? "text-green-500" : winRateDelta < -0.005 ? "text-red-500" : "text-muted-foreground"}`}>
                {winRateDelta >= 0 ? "+" : ""}{winRateDeltaPercent}% vs avg
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Conversion Score</p>
              <p className={`text-2xl font-medium tabular-nums ${conversionScore > 105 ? "stat-positive" : conversionScore < 95 ? "stat-negative" : ""}`}>
                {conversionScore}
              </p>
              <p className="text-xs text-muted-foreground">{stats.top_cuts} top cuts</p>
            </div>
          </div>

          {/* Time Period Selector */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Showing data from</span>
            <Select value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
              <SelectTrigger className="w-40 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_PERIOD_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Charts Section */}
      {(winRateChartData.length > 0 || playRateChartData.length > 0) && (
        <section className="border-t pt-12">
          <h2 className="text-lg font-medium mb-8">Trends</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Win Rate Over Time */}
            {winRateChartData.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-1">Win Rate Over Time</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Dashed line = {commanderWinRatePercent}% commander average
                </p>
                <ChartContainer
                  config={{ winRate: { label: "Win Rate", color: "hsl(var(--chart-1))" } }}
                  className="h-[180px] w-full"
                >
                  <LineChart data={winRateChartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 50]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={35} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name, item) => (
                            <div className="space-y-0.5">
                              <div className="font-medium">{Number(value).toFixed(1)}%</div>
                              <div className="text-xs text-muted-foreground">{Math.round(item.payload.entries)} decks</div>
                            </div>
                          )}
                        />
                      }
                    />
                    <ReferenceLine
                      y={commander_win_rate * 100}
                      stroke="hsl(var(--muted-foreground))"
                      strokeDasharray="5 5"
                      strokeOpacity={0.5}
                    />
                    <Line type="monotone" dataKey="winRate" stroke="var(--color-winRate)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ChartContainer>
              </div>
            )}

            {/* Play Rate Over Time */}
            {playRateChartData.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-1">Inclusion Rate Over Time</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Dashed line = {playRatePercent}% overall average
                </p>
                <ChartContainer
                  config={{ playRate: { label: "Inclusion Rate", color: "hsl(var(--chart-2))" } }}
                  className="h-[180px] w-full"
                >
                  <LineChart data={playRateChartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={35} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name, item) => (
                            <div className="space-y-0.5">
                              <div className="font-medium">{Number(value).toFixed(1)}%</div>
                              <div className="text-xs text-muted-foreground">{item.payload.entries} / {item.payload.commanderEntries} decks</div>
                            </div>
                          )}
                        />
                      }
                    />
                    <ReferenceLine
                      y={stats.play_rate * 100}
                      stroke="hsl(var(--muted-foreground))"
                      strokeDasharray="5 5"
                      strokeOpacity={0.5}
                    />
                    <Line type="monotone" dataKey="playRate" stroke="var(--color-playRate)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ChartContainer>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Performance Summary */}
      <section className="text-center">
        <p className="text-sm text-muted-foreground">
          Decks with {card.name} have a{" "}
          <span className={`font-medium ${roundedWinRate > roundedCommanderWinRate ? "text-green-500" : roundedWinRate < roundedCommanderWinRate ? "text-red-500" : "text-foreground"}`}>
            {winRatePercent}%
          </span>{" "}
          win rate
          {winRateComparison === "at" ? (
            <>, matching the commander's {commanderWinRatePercent}% average.</>
          ) : (
            <>, which is{" "}
              <span className={winRateComparison === "above" ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
                {winRateDelta >= 0 ? "+" : ""}{winRateDeltaPercent}%
              </span>{" "}
              {winRateComparison} the commander's {commanderWinRatePercent}% average.
            </>
          )}
        </p>
      </section>
    </div>
  );
}
