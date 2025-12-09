"use client";

import { ColorIdentity } from "@/components/color-identity";
import { DataTable, createStapleCardsColumns } from "@/components/shared/data-table";
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
import {
  useCommanderDetail,
  useCommanderCards,
  useCommanderSeats,
} from "@/hooks/use-queries";
import { TIME_PERIOD_OPTIONS, getMonthsToShow, isValidDataMonth, formatMonthLabel, type TimePeriod } from "@/lib/time-period";
import type { CommanderDetail as CommanderDetailType } from "@/types/api";
import {
  Loader2,
  RefreshCw,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";

interface CommanderDetailProps {
  commanderName: string;
  initialData?: CommanderDetailType;
}

function CommanderDetailSkeleton() {
  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row gap-8">
        <Skeleton className="w-48 aspect-[488/680] rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-6">
          <Skeleton className="h-10 w-96" />
          <div className="flex gap-12">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export function CommanderDetail({ commanderName, initialData }: CommanderDetailProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("6_months");

  const {
    data: commander,
    isLoading: commanderLoading,
    isFetching: commanderFetching,
    error: commanderError,
    refetch: refetchCommander,
  } = useCommanderDetail(commanderName, timePeriod);

  const {
    data: cardsData,
    isLoading: cardsLoading,
    isFetching: cardsFetching,
  } = useCommanderCards(commanderName, timePeriod);

  const {
    data: seatData,
    isLoading: seatsLoading,
    isFetching: seatsFetching,
  } = useCommanderSeats(commanderName, timePeriod);

  const cards = cardsData?.cards ?? [];

  // Use initialData as fallback when time period matches default
  const displayCommander = commander ?? (timePeriod === "6_months" ? initialData : undefined);

  const stapleCardsColumns = useMemo(
    () => (displayCommander ? createStapleCardsColumns(displayCommander.id) : []),
    [displayCommander]
  );

  if (commanderError) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-6">
          {commanderError instanceof Error ? commanderError.message : "Commander not found"}
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => refetchCommander()} variant="outline">
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

  if (commanderLoading && !displayCommander) {
    return <CommanderDetailSkeleton />;
  }

  if (!displayCommander) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-6">Commander not found</p>
        <Link href="/commanders">
          <Button variant="outline">Back to Commanders</Button>
        </Link>
      </div>
    );
  }

  const conversionScore = Math.round(displayCommander.stats.conversion_score);
  const winRatePercent = (displayCommander.stats.win_rate * 100).toFixed(1);

  const commanderNames = displayCommander.name.split(" / ");
  const commanderImages = commanderNames.map((name) => ({
    name: name.trim(),
    url: `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name.trim())}&format=image&version=normal`,
  }));

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="flex flex-col lg:flex-row gap-10">
        {/* Commander Image(s) */}
        <div className="relative flex-shrink-0" style={{ width: commanderImages.length > 1 ? "260px" : "180px" }}>
          {commanderImages.map((img, index) => (
            <div
              key={img.name}
              className="absolute rounded-lg overflow-hidden shadow-2xl bg-muted"
              style={{
                width: commanderImages.length > 1 ? "160px" : "180px",
                aspectRatio: "488/680",
                left: index === 0 ? 0 : "100px",
                zIndex: commanderImages.length - index,
                transform: index > 0 ? "rotate(4deg)" : undefined,
              }}
            >
              <Image
                src={img.url}
                alt={img.name}
                fill
                className="object-cover"
                priority
                unoptimized
              />
            </div>
          ))}
          <div style={{ aspectRatio: "488/680", width: commanderImages.length > 1 ? "160px" : "180px" }} />
        </div>

        {/* Commander Info */}
        <div className="flex-1 space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <ColorIdentity colorId={displayCommander.color_id} size="lg" />
              {commanderFetching && !commanderLoading && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight">{displayCommander.name}</h1>
          </div>

          {/* Stats - Clean inline layout */}
          <div className={`flex flex-wrap gap-x-12 gap-y-4 ${commanderFetching && !commanderLoading ? "opacity-60" : ""} transition-opacity`}>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Conversion Score</p>
              <p className={`text-2xl font-medium tabular-nums ${conversionScore > 105 ? "stat-positive" : conversionScore < 95 ? "stat-negative" : ""}`}>
                {conversionScore}
              </p>
              <p className="text-xs text-muted-foreground">{displayCommander.stats.top_cuts} top cuts</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Win Rate</p>
              <p className="text-2xl font-medium tabular-nums">{winRatePercent}%</p>
              <p className="text-xs text-muted-foreground">{displayCommander.stats.wins}W / {displayCommander.stats.losses}L</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Entries</p>
              <p className="text-2xl font-medium tabular-nums">{displayCommander.stats.entries.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">tournament decks</p>
            </div>
          </div>

          {/* Time Period Selector */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Showing data from</span>
            <Select
              value={timePeriod}
              onValueChange={(value) => setTimePeriod(value as TimePeriod)}
            >
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
      {(seatsLoading || displayCommander.trend?.length || (seatData && seatData.total_games > 0)) && (
        <section className="border-t pt-12">
          <h2 className="text-lg font-medium mb-8">Performance Trends</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Win Rate Over Time */}
            {displayCommander.trend && displayCommander.trend.length > 0 && (() => {
              const monthlyData = new Map<string, {
                month: string;
                label: string;
                entries: number;
                weightedWinRate: number;
              }>();
              
              for (const point of displayCommander.trend) {
                const date = new Date(point.week_start);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                const label = formatMonthLabel(date);
                
                const existing = monthlyData.get(monthKey) || {
                  month: monthKey,
                  label,
                  entries: 0,
                  weightedWinRate: 0,
                };
                
                existing.entries += point.entries;
                existing.weightedWinRate += point.win_rate * point.entries;
                monthlyData.set(monthKey, existing);
              }
              
              // Filter to show only complete months (exclude current month and data before start date)
              const completeMonths = Array.from(monthlyData.values())
                .filter((m) => isValidDataMonth(m.month))
                .sort((a, b) => a.month.localeCompare(b.month));
              
              const monthsToShow = getMonthsToShow(timePeriod);
              const displayMonths = monthsToShow !== null 
                ? completeMonths.slice(-monthsToShow)
                : completeMonths;
              
              const chartData = displayMonths.map((m) => ({
                month: m.label,
                winRate: m.entries > 0 ? (m.weightedWinRate / m.entries) * 100 : 0,
                entries: m.entries,
              }));
              
              return (
                <div>
                  <h3 className="text-sm font-medium mb-1">Win Rate</h3>
                  <p className="text-xs text-muted-foreground mb-4">{chartData.length} months of data</p>
                  <ChartContainer
                    config={{ winRate: { label: "Win Rate", color: "hsl(var(--chart-1))" } }}
                    className="h-[180px] w-full"
                  >
                    <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 50]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={35} />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent 
                            formatter={(value, name, item) => (
                              <div className="space-y-0.5">
                                <div className="font-medium">{Number(value).toFixed(1)}%</div>
                                <div className="text-xs text-muted-foreground">{item.payload.entries} entries</div>
                              </div>
                            )} 
                          />
                        }
                      />
                      <Line type="monotone" dataKey="winRate" stroke="var(--color-winRate)" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ChartContainer>
                </div>
              );
            })()}

            {/* Meta Share Over Time */}
            {displayCommander.trend && displayCommander.trend.length > 0 && (() => {
              const monthlyData = new Map<string, {
                month: string;
                label: string;
                entries: number;
                totalMetaEntries: number;
              }>();
              
              for (const point of displayCommander.trend) {
                const date = new Date(point.week_start);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                const label = formatMonthLabel(date);
                
                const existing = monthlyData.get(monthKey) || {
                  month: monthKey,
                  label,
                  entries: 0,
                  totalMetaEntries: 0,
                };
                
                existing.entries += point.entries;
                if (point.meta_share > 0) {
                  existing.totalMetaEntries += point.entries / point.meta_share;
                }
                monthlyData.set(monthKey, existing);
              }
              
              // Filter to show only complete months (exclude current month and data before start date)
              const completeMonths = Array.from(monthlyData.values())
                .filter((m) => isValidDataMonth(m.month))
                .sort((a, b) => a.month.localeCompare(b.month));
              
              const monthsToShow = getMonthsToShow(timePeriod);
              const displayMonths = monthsToShow !== null 
                ? completeMonths.slice(-monthsToShow)
                : completeMonths;
              
              const chartData = displayMonths.map((m) => ({
                month: m.label,
                metaShare: m.totalMetaEntries > 0 ? (m.entries / m.totalMetaEntries) * 100 : 0,
                entries: m.entries,
              }));
              
              return (
                <div>
                  <h3 className="text-sm font-medium mb-1">Meta Share</h3>
                  <p className="text-xs text-muted-foreground mb-4">% of tournament field</p>
                  <ChartContainer
                    config={{ metaShare: { label: "Meta Share", color: "hsl(var(--chart-3))" } }}
                    className="h-[180px] w-full"
                  >
                    <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={35} />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent 
                            formatter={(value, name, item) => (
                              <div className="space-y-0.5">
                                <div className="font-medium">{Number(value).toFixed(1)}%</div>
                                <div className="text-xs text-muted-foreground">{item.payload.entries} entries</div>
                              </div>
                            )} 
                          />
                        }
                      />
                      <Line type="monotone" dataKey="metaShare" stroke="var(--color-metaShare)" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ChartContainer>
                </div>
              );
            })()}

            {/* Seat Position */}
            {seatsLoading ? (
              <div>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-32 mb-4" />
                <Skeleton className="h-[180px] w-full" />
              </div>
            ) : seatData && seatData.total_games > 0 ? (
              <div className={seatsFetching && !seatsLoading ? "opacity-60 transition-opacity" : ""}>
                <h3 className="text-sm font-medium mb-1">Win Rate by Seat</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  {seatData.total_games.toLocaleString()} games • {(seatData.expected_win_rate * 100).toFixed(1)}% expected
                </p>
                <ChartContainer
                  config={{ winRate: { label: "Win Rate", color: "hsl(var(--chart-2))" } }}
                  className="h-[180px] w-full"
                >
                  <BarChart 
                    data={seatData.seats.map((seat) => ({
                      seat: `Seat ${seat.seat}`,
                      winRate: seat.winRate * 100,
                      games: seat.games,
                      wins: seat.wins,
                    }))}
                    margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                    <XAxis dataKey="seat" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 40]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={35} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name, item) => (
                            <div className="space-y-0.5">
                              <div className="font-medium">{Number(value).toFixed(1)}%</div>
                              <div className="text-xs text-muted-foreground">{item.payload.wins}W / {item.payload.games} games</div>
                            </div>
                          )}
                        />
                      }
                    />
                    <ReferenceLine y={seatData.expected_win_rate * 100} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" strokeOpacity={0.5} />
                    <Bar dataKey="winRate" fill="var(--color-winRate)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>
            ) : null}
          </div>
        </section>
      )}

      {/* Staple Cards Section */}
      <section className="border-t pt-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-medium">Staple Cards</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {cardsLoading ? "Loading cards..." : `${cards.length} cards played in ${displayCommander.name} decks`}
            </p>
          </div>
          {cardsFetching && !cardsLoading && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>
        
        {cardsLoading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : cards.length > 0 ? (
          <DataTable
            columns={stapleCardsColumns}
            data={cards}
            enableMinEntriesFilter
            minEntriesOptions={[5, 10, 25, 50, 100]}
            defaultMinEntries={5}
            getRowEntries={(row) => row.entries}
            defaultPageSize={10}
            globalFilter
          />
        ) : (
          <p className="text-muted-foreground py-8">
            No card data available for this time period.
          </p>
        )}
      </section>
    </div>
  );
}
