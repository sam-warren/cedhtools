"use client";

import { ColorIdentity } from "@/components/color-identity";
import { ManaCost } from "@/components/shared/mana-cost";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { CardCommanderStats, TimePeriod } from "@/types/api";
import {
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";

interface CardCommanderDetailProps {
  cardName: string;
  commanderId: string;
}

const timeOptions: { value: TimePeriod; label: string }[] = [
  { value: "1_month", label: "Past Month" },
  { value: "3_months", label: "Past 3 Months" },
  { value: "6_months", label: "Past 6 Months" },
  { value: "1_year", label: "Past Year" },
  { value: "all_time", label: "All Time" },
];

export function CardCommanderDetail({ cardName, commanderId }: CardCommanderDetailProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("3_months");
  const [data, setData] = useState<CardCommanderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/cards/${encodeURIComponent(cardName)}/commanders/${commanderId}?timePeriod=${timePeriod}`
        );

        if (!response.ok) throw new Error("Data not found");

        const result: CardCommanderStats = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [cardName, commanderId, timePeriod]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error || "Data not found"}</p>
        <Link href="/commanders">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Commanders
          </Button>
        </Link>
      </div>
    );
  }

  const { card, commander, stats, trend, popularity_trend } = data;

  const playRatePercent = (stats.play_rate * 100).toFixed(1);
  const winRatePercent = (stats.win_rate * 100).toFixed(1);
  const conversionPercent = (stats.conversion_rate * 100).toFixed(1);

  // Scryfall image URLs
  const cardImageUrl = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(card.name)}&format=image&version=normal`;
  const commanderImageUrl = `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(commander.name.split(" / ")[0])}&format=image&version=small`;

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <Link
        href={`/commanders/${encodeURIComponent(commander.name)}`}
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to {commander.name}
      </Link>

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Card Image */}
        <div className="flex-shrink-0">
          <div className="relative w-64 aspect-[488/680] rounded-lg overflow-hidden shadow-lg bg-muted">
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
        <div className="flex-1 space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold">{card.name}</h1>
              {card.mana_cost && <ManaCost cost={card.mana_cost} size="lg" />}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-11 rounded overflow-hidden">
                <Image
                  src={commanderImageUrl}
                  alt={commander.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Statistics in</p>
                <Link
                  href={`/commanders/${encodeURIComponent(commander.name)}`}
                  className="font-medium text-primary hover:underline"
                >
                  {commander.name}
                </Link>
              </div>
              <ColorIdentity colorId={commander.color_id} size="sm" />
            </div>
            {card.type_line && (
              <p className="text-sm text-muted-foreground mt-2">{card.type_line}</p>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard
              label="Play Rate"
              value={`${playRatePercent}%`}
              subValue={`${stats.entries} decks`}
              icon={<Users className="w-5 h-5" />}
            />
            <StatCard
              label="Win Rate"
              value={`${winRatePercent}%`}
              subValue={`${stats.wins}W / ${stats.losses}L`}
              trend={stats.win_rate > 0.25 ? "positive" : stats.win_rate < 0.25 ? "negative" : undefined}
              icon={<TrendingUp className="w-5 h-5" />}
            />
            <StatCard
              label="Conversion Rate"
              value={`${conversionPercent}%`}
              subValue={`${stats.top_cuts} top cuts`}
              icon={<Trophy className="w-5 h-5" />}
            />
          </div>

          {/* Time Period Selector */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Time period:</span>
            <Select value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Win Rate Trend */}
        {trend && trend.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Win Rate Over Time</CardTitle>
              <p className="text-sm text-muted-foreground">
                Weekly win rate (dashed line = 25% expected)
              </p>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  winRate: {
                    label: "Win Rate",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[200px]"
              >
                <LineChart data={trend.slice(-12).map((point, i) => ({
                  week: `W${i + 1}`,
                  winRate: point.win_rate * 100,
                  entries: point.entries,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="week" className="text-xs" />
                  <YAxis domain={[0, 50]} tickFormatter={(v) => `${v}%`} className="text-xs" />
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(value) => `${Number(value).toFixed(1)}%`} />}
                  />
                  <ReferenceLine
                    y={25}
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="5 5"
                  />
                  <Line
                    type="monotone"
                    dataKey="winRate"
                    stroke="var(--color-winRate)"
                    strokeWidth={2}
                    dot={{ fill: "var(--color-winRate)" }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Popularity Trend */}
        {popularity_trend && popularity_trend.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Popularity Over Time</CardTitle>
              <p className="text-sm text-muted-foreground">
                Weekly deck count (last {Math.min(popularity_trend.length, 12)} weeks)
              </p>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  entries: {
                    label: "Decks",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="h-[200px]"
              >
                <BarChart data={popularity_trend.slice(-12).map((point, i) => ({
                  week: `W${i + 1}`,
                  entries: point.entries,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="week" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip
                    content={<ChartTooltipContent formatter={(value) => `${value} decks`} />}
                  />
                  <Bar
                    dataKey="entries"
                    fill="var(--color-entries)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Analysis Section */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Play Rate Comparison</h4>
              <p className="text-sm text-muted-foreground">
                {card.name} is played in{" "}
                <span className="font-medium text-foreground">{playRatePercent}%</span>{" "}
                of {commander.name} decks in tournaments.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Performance Impact</h4>
              <p className="text-sm text-muted-foreground">
                Decks with this card have a{" "}
                <span className={`font-medium ${stats.win_rate > 0.25 ? "text-green-500" : stats.win_rate < 0.25 ? "text-red-500" : "text-foreground"}`}>
                  {winRatePercent}%
                </span>{" "}
                win rate, which is{" "}
                {stats.win_rate > 0.25
                  ? "above"
                  : stats.win_rate < 0.25
                  ? "below"
                  : "at"}{" "}
                the expected 25%.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

