"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ColorIdentity } from "@/components/color-identity";
import { StatCard } from "@/components/stat-card";
import { ManaCost } from "@/components/mana-cost";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Bar, BarChart, XAxis, YAxis, ReferenceLine, Line, LineChart, CartesianGrid } from "recharts";
import {
  Trophy,
  Users,
  TrendingUp,
  Percent,
  ExternalLink,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Search,
  ArrowUpDown,
} from "lucide-react";
import type {
  CommanderDetail as CommanderDetailType,
  CommanderCardsResponse,
  SeatPositionResponse,
  TimePeriod,
  CardWithStats,
} from "@/types/api";

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

type SortField = "name" | "play_rate" | "win_rate" | "win_rate_delta" | "conversion_rate";
type SortDirection = "asc" | "desc";
const ITEMS_PER_PAGE = 25;

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

  // Table state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("play_rate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [minEntries, setMinEntries] = useState<number>(5);
  const [currentPage, setCurrentPage] = useState(1);

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

  // Get unique card types for filter
  const cardTypes = useMemo(() => {
    const types = new Set<string>();
    cards.forEach((card) => {
      if (card.type_line) {
        // Extract main type (before the em dash)
        const mainType = card.type_line.split("—")[0].trim();
        mainType.split(" ").forEach((t) => {
          if (["Creature", "Instant", "Sorcery", "Artifact", "Enchantment", "Land", "Planeswalker"].includes(t)) {
            types.add(t);
          }
        });
      }
    });
    return Array.from(types).sort();
  }, [cards]);

  // Filter and sort cards
  const filteredCards = useMemo(() => {
    let result = [...cards];

    // Minimum entries filter
    result = result.filter((card) => card.entries >= minEntries);

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((card) =>
        card.name.toLowerCase().includes(query) ||
        card.type_line?.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (typeFilter) {
      result = result.filter((card) =>
        card.type_line?.toLowerCase().includes(typeFilter.toLowerCase())
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "play_rate":
          comparison = a.play_rate - b.play_rate;
          break;
        case "win_rate":
          comparison = a.win_rate - b.win_rate;
          break;
        case "win_rate_delta":
          comparison = a.win_rate_delta - b.win_rate_delta;
          break;
        case "conversion_rate":
          comparison = a.conversion_rate - b.conversion_rate;
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [cards, searchQuery, typeFilter, minEntries, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredCards.length / ITEMS_PER_PAGE);
  const paginatedCards = filteredCards.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, typeFilter, minEntries, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    return sortDirection === "asc" 
      ? <ChevronUp className="w-4 h-4 ml-1" />
      : <ChevronDown className="w-4 h-4 ml-1" />;
  };

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
              onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
              className="w-40"
            >
              {timeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Trend Charts & Seat Position */}
      {(seatsLoading || commander.trend?.length) ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Win Rate Trend */}
          {commander.trend && commander.trend.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Over Time</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Weekly win rate trend (last {Math.min(commander.trend.length, 12)} weeks)
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
                  className="h-[250px] w-full"
                >
                  <LineChart 
                    data={commander.trend.slice(-12).map((point, i) => ({
                      week: `W${i + 1}`,
                      winRate: point.win_rate * 100,
                      entries: point.entries,
                    }))}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} width={45} />
                    <ChartTooltip
                      content={<ChartTooltipContent formatter={(value) => `${Number(value).toFixed(1)}%`} />}
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
          )}

          {/* Seat Position */}
          {seatsLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="w-48 h-6" />
                <Skeleton className="w-64 h-4 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[200px] w-full" />
              </CardContent>
            </Card>
          ) : seatData && seatData.total_games > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Win Rate by Seat Position</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Expected: {(seatData.expected_win_rate * 100).toFixed(0)}% • {seatData.total_games} games
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
                  className="h-[250px] w-full"
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
                    <XAxis dataKey="seat" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 50]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} width={45} />
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Staple Cards</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {cardsLoading ? "Loading..." : `${filteredCards.length} cards in ${commander.name} decks`}
              </p>
            </div>
          </div>
          
          {/* Filters */}
          {!cardsLoading && cards.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-4">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-40"
              >
                <option value="">All Types</option>
                {cardTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
              <Select
                value={String(minEntries)}
                onChange={(e) => setMinEntries(Number(e.target.value))}
                className="w-36"
              >
                <option value="5">Min 5 decks</option>
                <option value="10">Min 10 decks</option>
                <option value="25">Min 25 decks</option>
                <option value="50">Min 50 decks</option>
                <option value="100">Min 100 decks</option>
              </Select>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {cardsLoading ? (
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredCards.length > 0 ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 w-[300px]"
                        onClick={() => handleSort("name")}
                      >
                        <div className="flex items-center">
                          Card
                          <SortIcon field="name" />
                        </div>
                      </TableHead>
                      <TableHead className="w-[120px]">Mana Cost</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 text-right w-[100px]"
                        onClick={() => handleSort("play_rate")}
                      >
                        <div className="flex items-center justify-end">
                          Play Rate
                          <SortIcon field="play_rate" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 text-right w-[100px]"
                        onClick={() => handleSort("win_rate")}
                      >
                        <div className="flex items-center justify-end">
                          Win Rate
                          <SortIcon field="win_rate" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 text-right w-[100px]"
                        onClick={() => handleSort("win_rate_delta")}
                      >
                        <div className="flex items-center justify-end">
                          WR Δ
                          <SortIcon field="win_rate_delta" />
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50 text-right w-[100px]"
                        onClick={() => handleSort("conversion_rate")}
                      >
                        <div className="flex items-center justify-end">
                          Conversion
                          <SortIcon field="conversion_rate" />
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCards.map((card) => (
                      <TableRow key={card.id}>
                        <TableCell>
                          <Link
                            href={`/cards/${encodeURIComponent(card.name)}/commanders/${commander.id}`}
                            className="font-medium hover:underline hover:text-primary"
                          >
                            {card.name}
                          </Link>
                          {card.type_line && (
                            <p className="text-xs text-muted-foreground truncate max-w-[280px]">
                              {card.type_line}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <ManaCost cost={card.mana_cost} size="sm" />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {(card.play_rate * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right">
                          {(card.win_rate * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={
                            card.win_rate_delta > 0.02 
                              ? "text-green-500" 
                              : card.win_rate_delta < -0.02 
                                ? "text-red-500" 
                                : "text-muted-foreground"
                          }>
                            {card.win_rate_delta >= 0 ? "+" : ""}
                            {(card.win_rate_delta * 100).toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {(card.conversion_rate * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-2 py-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredCards.length)} of {filteredCards.length} cards
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm px-2">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      Last
                    </Button>
                  </div>
                </div>
              )}
            </>
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
