"use client";

import { ColorIdentity } from "@/components/color-identity";
import { DataTable, createStapleCardsColumns } from "@/components/shared/data-table";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  CardWithStats,
  CommanderCardsResponse,
  CommanderDetail as CommanderDetailType,
  SeatPositionResponse,
  TimePeriod,
} from "@/types/api";
import {
  ChevronRight,
  ExternalLink,
  Percent,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";

interface CommanderDetailProps {
  commanderName: string;
}

const timeOptions: { value: TimePeriod; label: string }[] = [
  { value: "1_month", label: "Past Month" },
  { value: "3_months", label: "Past 3 Months" },
  { value: "6_months", label: "Past 6 Months" },
  { value: "1_year", label: "Past Year" },
  { value: "all_time", label: "All Time" },
];

// Skeleton Components
function CommanderHeaderSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="flex gap-2 flex-shrink-0">
        <Skeleton className="w-48 aspect-[488/680] rounded-lg" />
      </div>
      <div className="flex-1 space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Skeleton className="w-6 h-6 rounded-full" />
            <Skeleton className="w-20 h-5 rounded" />
          </div>
          <Skeleton className="w-64 h-10 rounded" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="w-48 h-10 rounded" />
      </div>
    </div>
  );
}

function ChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <Skeleton className="w-48 h-6" />
          <Skeleton className="w-64 h-4 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="w-48 h-6" />
          <Skeleton className="w-64 h-4 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

function StapleCardsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="w-32 h-6" />
        <Skeleton className="w-64 h-4 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function EntriesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="w-48 h-6" />
        <Skeleton className="w-64 h-4 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function CommanderDetail({ commanderName }: CommanderDetailProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("3_months");
  
  // Separate loading states
  const [commanderLoading, setCommanderLoading] = useState(true);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [seatsLoading, setSeatsLoading] = useState(true);
  
  const [commander, setCommander] = useState<CommanderDetailType | null>(null);
  const [cards, setCards] = useState<CardWithStats[]>([]);
  const [seatData, setSeatData] = useState<SeatPositionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch commander data
  useEffect(() => {
    const fetchCommander = async () => {
      try {
        setCommanderLoading(true);
        const res = await fetch(
          `/api/commanders/${encodeURIComponent(commanderName)}?timePeriod=${timePeriod}`
        );
        if (!res.ok) throw new Error("Commander not found");
        const data = await res.json();
        setCommander(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setCommanderLoading(false);
      }
    };
    fetchCommander();
  }, [commanderName, timePeriod]);

  // Fetch cards data (separate effect)
  useEffect(() => {
    const fetchCards = async () => {
      try {
        setCardsLoading(true);
        const res = await fetch(
          `/api/commanders/${encodeURIComponent(commanderName)}/cards?timePeriod=${timePeriod}`
        );
        if (res.ok) {
          const data: CommanderCardsResponse = await res.json();
          setCards(data.cards);
        }
      } catch {
        // Cards are optional, don't set error
      } finally {
        setCardsLoading(false);
      }
    };
    fetchCards();
  }, [commanderName, timePeriod]);

  // Fetch seat data (separate effect)
  useEffect(() => {
    const fetchSeats = async () => {
      try {
        setSeatsLoading(true);
        const res = await fetch(
          `/api/commanders/${encodeURIComponent(commanderName)}/seats`
        );
        if (res.ok) {
          const data: SeatPositionResponse = await res.json();
          setSeatData(data);
        }
      } catch {
        // Seats are optional, don't set error
      } finally {
        setSeatsLoading(false);
      }
    };
    fetchSeats();
  }, [commanderName]);

  // Memoize columns to avoid recreating on every render
  const stapleCardsColumns = useMemo(
    () => (commander ? createStapleCardsColumns(commander.id) : []),
    [commander]
  );

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Link href="/commanders">
          <Button variant="outline">Back to Commanders</Button>
        </Link>
      </div>
    );
  }

  // Show skeleton if commander is still loading
  if (commanderLoading) {
    return (
      <div className="space-y-8">
        <CommanderHeaderSkeleton />
        <ChartsSkeleton />
        <StapleCardsSkeleton />
        <EntriesSkeleton />
      </div>
    );
  }

  if (!commander) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">Commander not found</p>
        <Link href="/commanders">
          <Button variant="outline">Back to Commanders</Button>
        </Link>
      </div>
    );
  }

  const conversionPercent = (commander.stats.conversion_rate * 100).toFixed(1);
  const winRatePercent = (commander.stats.win_rate * 100).toFixed(1);

  // Generate Scryfall image URLs for all commanders (handle partners)
  const commanderNames = commander.name.split(" / ");
  const commanderImages = commanderNames.map((name) => ({
    name: name.trim(),
    url: `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name.trim())}&format=image&version=normal`,
  }));

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Commander Image(s) */}
        <div className="relative flex-shrink-0" style={{ width: commanderImages.length > 1 ? "280px" : "192px" }}>
          {commanderImages.map((img, index) => (
            <div
              key={img.name}
              className="absolute rounded-lg overflow-hidden shadow-xl bg-muted border border-border"
              style={{
                width: commanderImages.length > 1 ? "180px" : "192px",
                aspectRatio: "488/680",
                left: index === 0 ? 0 : "100px",
                zIndex: commanderImages.length - index, // First card on top
                transform: index > 0 ? "rotate(3deg)" : undefined,
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
          {/* Spacer to maintain layout height */}
          <div style={{ aspectRatio: "488/680", width: commanderImages.length > 1 ? "180px" : "192px" }} />
        </div>

        {/* Commander Info */}
        <div className="flex-1 space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <ColorIdentity colorId={commander.color_id} size="lg" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">{commander.name}</h1>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Conversion Rate"
              value={`${conversionPercent}%`}
              subValue={`${commander.stats.top_cuts} of ${commander.stats.entries}`}
              trend="positive"
              icon={<TrendingUp className="w-5 h-5" />}
            />
            <StatCard
              label="Win Rate"
              value={`${winRatePercent}%`}
              icon={<Percent className="w-5 h-5" />}
            />
            <StatCard
              label="Total Entries"
              value={commander.stats.entries}
              icon={<Users className="w-5 h-5" />}
            />
            <StatCard
              label="Top Cuts"
              value={commander.stats.top_cuts}
              icon={<Trophy className="w-5 h-5" />}
            />
          </div>

          {/* Time Period Selector */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Time period:</span>
            <Select
              value={timePeriod}
              onValueChange={(value) => setTimePeriod(value as TimePeriod)}
            >
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

      {/* Trend Charts & Seat Position */}
      {(seatsLoading || commander.trend?.length) ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Win Rate Over Time */}
          {commander.trend && commander.trend.length > 0 && (() => {
            // Aggregate weekly data into monthly data using weighted averages
            const monthlyData = new Map<string, {
              month: string;
              label: string;
              entries: number;
              weightedWinRate: number; // Sum of (win_rate * entries) for weighted average
            }>();
            
            for (const point of commander.trend) {
              const date = new Date(point.week_start);
              const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
              const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
              
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
            
            const chartData = Array.from(monthlyData.values())
              .sort((a, b) => a.month.localeCompare(b.month))
              .map((m) => ({
                month: m.label,
                winRate: m.entries > 0 ? (m.weightedWinRate / m.entries) * 100 : 0,
                entries: m.entries,
              }));
            
            return (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Win Rate Over Time</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {chartData.length} month{chartData.length !== 1 ? 's' : ''} of data
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
                    className="h-[220px] w-full"
                  >
                    <LineChart 
                      data={chartData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} width={40} />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent 
                            formatter={(value, name, item) => {
                              const payload = item.payload;
                              return (
                                <div className="space-y-1">
                                  <div className="font-medium">{Number(value).toFixed(1)}% win rate</div>
                                  <div className="text-xs text-muted-foreground">
                                    {payload.entries} entries
                                  </div>
                                </div>
                              );
                            }} 
                          />
                        }
                      />
                      <Line
                        type="monotone"
                        dataKey="winRate"
                        stroke="var(--color-winRate)"
                        strokeWidth={2}
                        dot={{ fill: "var(--color-winRate)", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            );
          })()}

          {/* Meta Share Over Time */}
          {commander.trend && commander.trend.length > 0 && (() => {
            // Aggregate weekly data into monthly data
            const monthlyData = new Map<string, {
              month: string;
              label: string;
              entries: number;
              totalMetaEntries: number;
            }>();
            
            for (const point of commander.trend) {
              const date = new Date(point.week_start);
              const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
              const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
              
              const existing = monthlyData.get(monthKey) || {
                month: monthKey,
                label,
                entries: 0,
                totalMetaEntries: 0,
              };
              
              existing.entries += point.entries;
              // Calculate total meta entries from meta_share: entries / meta_share = totalMetaEntries
              if (point.meta_share > 0) {
                existing.totalMetaEntries += point.entries / point.meta_share;
              }
              
              monthlyData.set(monthKey, existing);
            }
            
            const chartData = Array.from(monthlyData.values())
              .sort((a, b) => a.month.localeCompare(b.month))
              .map((m) => ({
                month: m.label,
                metaShare: m.totalMetaEntries > 0 ? (m.entries / m.totalMetaEntries) * 100 : 0,
                entries: m.entries,
              }));
            
            return (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Meta Share Over Time</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    % of meta each month
                  </p>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      metaShare: {
                        label: "Meta Share",
                        color: "hsl(var(--chart-3))",
                      },
                    }}
                    className="h-[220px] w-full"
                  >
                    <LineChart 
                      data={chartData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} width={40} />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent 
                            formatter={(value, name, item) => {
                              const payload = item.payload;
                              return (
                                <div className="space-y-1">
                                  <div className="font-medium">{Number(value).toFixed(1)}% of meta</div>
                                  <div className="text-xs text-muted-foreground">
                                    {payload.entries} entries
                                  </div>
                                </div>
                              );
                            }} 
                          />
                        }
                      />
                      <Line
                        type="monotone"
                        dataKey="metaShare"
                        stroke="var(--color-metaShare)"
                        strokeWidth={2}
                        dot={{ fill: "var(--color-metaShare)", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            );
          })()}

          {/* Seat Position */}
          {seatsLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="w-48 h-6" />
                <Skeleton className="w-64 h-4 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[220px] w-full" />
              </CardContent>
            </Card>
          ) : seatData && seatData.total_games > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Win Rate by Seat</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Expected: {(seatData.expected_win_rate * 100).toFixed(0)}% • {seatData.total_games.toLocaleString()} games
                </p>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    winRate: {
                      label: "Win Rate",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="h-[220px] w-full"
                >
                  <BarChart 
                    data={seatData.seats.map((seat) => ({
                      seat: `Seat ${seat.seat}`,
                      winRate: seat.winRate * 100,
                      games: seat.games,
                      wins: seat.wins,
                    }))}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="seat" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 50]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} width={40} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name, item) => {
                            const payload = item.payload;
                            return (
                              <div className="space-y-1">
                                <div className="font-medium">{Number(value).toFixed(1)}% Win Rate</div>
                                <div className="text-xs text-muted-foreground">
                                  {payload.wins} wins / {payload.games} games
                                </div>
                              </div>
                            );
                          }}
                        />
                      }
                    />
                    <ReferenceLine
                      y={seatData.expected_win_rate * 100}
                      stroke="hsl(var(--muted-foreground))"
                      strokeDasharray="5 5"
                    />
                    <Bar
                      dataKey="winRate"
                      fill="var(--color-winRate)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      {/* Staple Cards Section - Table View */}
      <Card>
        <CardHeader>
          <CardTitle>Staple Cards</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {cardsLoading ? "Loading..." : `${cards.length} cards in ${commander.name} decks`}
          </p>
        </CardHeader>
        <CardContent>
          {cardsLoading ? (
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
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
            <p className="text-muted-foreground text-center py-8">
              No staple card data available for this time period.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Entries Section */}
      {commander.entries && commander.entries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Tournament Entries</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Latest tournament performances with {commander.name}
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Tournament</TableHead>
                    <TableHead className="text-center">Standing</TableHead>
                    <TableHead className="text-center">Record</TableHead>
                    <TableHead className="text-right">Decklist</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commander.entries.slice(0, 10).map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.player?.name || "Unknown"}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {entry.tournament?.name || "Unknown Tournament"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.tournament?.tournament_date
                              ? new Date(entry.tournament.tournament_date).toLocaleDateString()
                              : ""}
                            {entry.tournament?.size && ` • ${entry.tournament.size} players`}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={entry.standing && entry.standing <= 4 ? "default" : "secondary"}
                        >
                          #{entry.standing || "?"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        <span className="text-green-500">
                          {entry.wins_swiss + entry.wins_bracket}
                        </span>
                        -
                        <span className="text-red-500">
                          {entry.losses_swiss + entry.losses_bracket}
                        </span>
                        {entry.draws > 0 && (
                          <>
                            -<span className="text-muted-foreground">{entry.draws}</span>
                          </>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.tournament?.tid && entry.player?.topdeck_id && (
                          <a
                            href={`https://topdeck.gg/deck/${entry.tournament.tid}/${entry.player.topdeck_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            View <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CTA for Deck Analysis */}
      <Card className="border-primary/20">
        <CardContent className="py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">
                Analyze Your {commander.name} Deck
              </h3>
              <p className="text-muted-foreground">
                Paste your decklist to see personalized card recommendations
                based on tournament data.
              </p>
            </div>
            <Link href="/analyze">
              <Button size="lg">
                Analyze Deck
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
