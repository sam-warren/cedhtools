"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Users,
  Trophy,
  ExternalLink,
  RefreshCw,
  Search,
  ArrowDown,
  X,
  Loader2,
} from "lucide-react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";
import { useTimePeriod } from "@/lib/contexts/time-period-context";
import { TIME_PERIOD_OPTIONS } from "@/lib/utils/time-period";
import type { TimePeriod } from "@/types/api";

interface Tournament {
  id: number;
  tid: string;
  name: string;
  tournament_date: string;
  size: number;
  swiss_rounds: number;
  top_cut: number;
  bracket_url: string | null;
}

interface TournamentsResponse {
  tournaments: Tournament[];
  total: number;
}

interface FiltersData {
  topCuts: number[];
  sizeRange: { min: number; max: number };
}

type SortBy = "date" | "size" | "top_cut";
type SortOrder = "asc" | "desc";

const sizeOptions: { value: string; label: string }[] = [
  { value: "0", label: "All Sizes" },
  { value: "16", label: "16+ Players" },
  { value: "32", label: "32+ Players" },
  { value: "60", label: "60+ Players" },
  { value: "100", label: "100+ Players" },
];

const sortOptions: { value: SortBy; label: string }[] = [
  { value: "date", label: "Date" },
  { value: "size", label: "Size" },
  { value: "top_cut", label: "Top Cut" },
];

// Default filter values
const DEFAULT_TIME_PERIOD: TimePeriod = "6_months";
const DEFAULT_MIN_SIZE = "0";
const DEFAULT_TOP_CUT = "all";
const DEFAULT_SORT_BY: SortBy = "date";
const DEFAULT_SORT_ORDER: SortOrder = "desc";

async function fetchTournaments(params: {
  limit: number;
  offset: number;
  timePeriod: TimePeriod;
  sortBy: SortBy;
  sortOrder: SortOrder;
  search: string;
  minSize: string;
  topCut: string;
}): Promise<TournamentsResponse> {
  const searchParams = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
    timePeriod: params.timePeriod,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });

  if (params.search) searchParams.set("search", params.search);
  if (params.minSize !== "0") searchParams.set("minSize", params.minSize);
  if (params.topCut !== "all") searchParams.set("topCut", params.topCut);

  const response = await fetch(`/api/tournaments?${searchParams}`);
  if (!response.ok) throw new Error("Failed to fetch tournaments");
  return response.json();
}

async function fetchFilters(): Promise<FiltersData> {
  const response = await fetch("/api/tournaments/filters");
  if (!response.ok) throw new Error("Failed to fetch filters");
  return response.json();
}

export function TournamentBrowser() {
  // Hydration safety - ensure consistent initial render
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Filters
  const { timePeriod, setTimePeriod } = useTimePeriod();
  const [searchQuery, setSearchQuery] = useState("");
  const [minSize, setMinSize] = useState(DEFAULT_MIN_SIZE);
  const [topCutFilter, setTopCutFilter] = useState<string>(DEFAULT_TOP_CUT);
  const [sortBy, setSortBy] = useState<SortBy>(DEFAULT_SORT_BY);
  const [sortOrder, setSortOrder] = useState<SortOrder>(DEFAULT_SORT_ORDER);

  // Debounce search
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Pagination - display count
  const [displayCount, setDisplayCount] = useState(20);
  const limit = 100; // Fetch more upfront

  // Check if any filters are non-default
  const hasActiveFilters =
    timePeriod !== DEFAULT_TIME_PERIOD ||
    searchQuery !== "" ||
    minSize !== DEFAULT_MIN_SIZE ||
    topCutFilter !== DEFAULT_TOP_CUT ||
    sortBy !== DEFAULT_SORT_BY ||
    sortOrder !== DEFAULT_SORT_ORDER;

  const clearFilters = () => {
    setTimePeriod(DEFAULT_TIME_PERIOD);
    setSearchQuery("");
    setMinSize(DEFAULT_MIN_SIZE);
    setTopCutFilter(DEFAULT_TOP_CUT);
    setSortBy(DEFAULT_SORT_BY);
    setSortOrder(DEFAULT_SORT_ORDER);
  };

  // Fetch filter options
  const { data: filtersData } = useQuery({
    queryKey: ["tournament-filters"],
    queryFn: fetchFilters,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch tournaments with keepPreviousData for smooth transitions
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["tournaments", timePeriod, debouncedSearch, minSize, topCutFilter, sortBy, sortOrder],
    queryFn: () =>
      fetchTournaments({
        limit,
        offset: 0,
        timePeriod,
        sortBy,
        sortOrder,
        search: debouncedSearch,
        minSize,
        topCut: topCutFilter,
      }),
    placeholderData: keepPreviousData,
  });

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(20);
  }, [timePeriod, debouncedSearch, minSize, topCutFilter, sortBy, sortOrder]);

  const tournaments = data?.tournaments ?? [];
  const total = data?.total ?? 0;
  const displayedTournaments = tournaments.slice(0, displayCount);
  const hasMore = displayCount < tournaments.length || displayCount < total;

  const loadMore = () => {
    setDisplayCount((prev) => Math.min(prev + 20, tournaments.length));
  };

  // Show skeleton on server and initial client render for hydration safety
  const showInitialLoading = !mounted || isLoading;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  return (
    <div>
      {/* Search */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tournaments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Select value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
          <SelectTrigger className="w-36">
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

        <Select value={minSize} onValueChange={setMinSize}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sizeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={topCutFilter} onValueChange={setTopCutFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Top Cut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Top Cuts</SelectItem>
            {filtersData?.topCuts.map((tc) => (
              <SelectItem key={tc} value={String(tc)}>
                Top {tc}
              </SelectItem>
            ))}
            <SelectItem value="0">Swiss Only</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
            <SelectTrigger className="w-28 rounded-r-none border-r-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleSortOrder}
            title={sortOrder === "asc" ? "Ascending" : "Descending"}
            className="rounded-l-none"
          >
            <ArrowDown 
              className={`h-4 w-4 transition-transform duration-200 ${
                sortOrder === "asc" ? "rotate-180" : ""
              }`} 
            />
          </Button>
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10">
            <X className="w-4 h-4 mr-1" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Results count with loading indicator */}
      <div className="flex items-center gap-2 mb-4">
        <p className="text-sm text-muted-foreground">
          {showInitialLoading
            ? "Loading tournaments..."
            : `Showing ${displayedTournaments.length} of ${total} tournaments`}
        </p>
        {mounted && isFetching && !isLoading && (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Error state */}
      {mounted && error && (
        <div className="text-center py-8">
          <p className="text-destructive mb-4">
            {error instanceof Error ? error.message : "An error occurred"}
          </p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      )}

      {/* Tournament list */}
      {!(mounted && error) && (
        <div className={`space-y-4 ${mounted && isFetching && !isLoading ? "opacity-60" : ""} transition-opacity duration-200`}>
          {showInitialLoading
            ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
            : displayedTournaments.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} formatDate={formatDate} />
              ))}

          {!showInitialLoading && displayedTournaments.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No tournaments found matching your filters.
              </CardContent>
            </Card>
          )}

          {hasMore && !showInitialLoading && (
            <div className="flex justify-center mt-6">
              <Button onClick={loadMore} variant="outline">
                Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TournamentCard({ tournament, formatDate }: { tournament: Tournament; formatDate: (date: string) => string }) {
  return (
    <Card className="card-hover">
      <CardContent className="py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{tournament.name}</h3>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(tournament.tournament_date)}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {tournament.size} players
              </span>
              {tournament.top_cut > 0 ? (
                <span className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  Top {tournament.top_cut}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-muted-foreground/60">
                  Swiss Only
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="secondary">
              {tournament.swiss_rounds} Swiss rounds
            </Badge>
            {tournament.bracket_url && (
              <a
                href={tournament.bracket_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  View Bracket
                  <ExternalLink className="w-3 h-3 ml-2" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
