"use client";

import { CommanderCard, CommanderCardSkeleton } from "@/components/shared/commander-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { TIME_PERIOD_OPTIONS, type TimePeriod } from "@/lib/utils/time-period";
import type { CommanderListItem, SortBy } from "@/types/api";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { RefreshCw, Search, X, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

const sortOptions: { value: SortBy; label: string }[] = [
  { value: "popularity", label: "Popularity" },
  { value: "conversion", label: "Conversion Score" },
  { value: "win_rate", label: "Win Rate" },
];

const sizeOptions: { value: string; label: string }[] = [
  { value: "0", label: "All Events" },
  { value: "16", label: "16+ Players" },
  { value: "32", label: "32+ Players" },
  { value: "60", label: "60+ Players" },
];

// Default filter values
const DEFAULT_SORT_BY: SortBy = "popularity";
const DEFAULT_TIME_PERIOD: TimePeriod = "6_months";
const DEFAULT_MIN_SIZE = "0";

interface CommandersResponse {
  commanders: CommanderListItem[];
  total: number;
}

interface CommanderBrowserProps {
  initialData?: CommandersResponse;
}

async function fetchCommanders(params: {
  limit: number;
  offset: number;
  timePeriod: TimePeriod;
  sortBy: SortBy;
  minTournamentSize: string;
  search: string;
}): Promise<CommandersResponse> {
  const searchParams = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
    timePeriod: params.timePeriod,
    sortBy: params.sortBy,
    minEntries: "5",
    minTournamentSize: params.minTournamentSize,
  });

  if (params.search) searchParams.set("search", params.search);

  const response = await fetch(`/api/commanders?${searchParams}`);
  if (!response.ok) throw new Error("Failed to fetch commanders");
  return response.json();
}

export function CommanderBrowser({ initialData }: CommanderBrowserProps) {
  // Hydration safety - ensure consistent initial render
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Filters
  const [sortBy, setSortBy] = useState<SortBy>(DEFAULT_SORT_BY);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(DEFAULT_TIME_PERIOD);
  const [minTournamentSize, setMinTournamentSize] = useState(DEFAULT_MIN_SIZE);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Debounce search to avoid too many requests
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Pagination
  const [displayCount, setDisplayCount] = useState(24);
  const limit = 100; // Fetch more, display less

  // Check if filters match the default values (which initialData was fetched with)
  const isDefaultFilters = 
    sortBy === DEFAULT_SORT_BY &&
    timePeriod === DEFAULT_TIME_PERIOD &&
    minTournamentSize === DEFAULT_MIN_SIZE &&
    debouncedSearch === "";

  // Check if any filters are non-default
  const hasActiveFilters =
    sortBy !== DEFAULT_SORT_BY ||
    timePeriod !== DEFAULT_TIME_PERIOD ||
    minTournamentSize !== DEFAULT_MIN_SIZE ||
    searchQuery !== "";

  const clearFilters = () => {
    setSortBy(DEFAULT_SORT_BY);
    setTimePeriod(DEFAULT_TIME_PERIOD);
    setMinTournamentSize(DEFAULT_MIN_SIZE);
    setSearchQuery("");
  };

  // Use TanStack Query with keepPreviousData for smooth transitions
  // Pass initialData only when filters match defaults
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["commanders", sortBy, timePeriod, minTournamentSize, debouncedSearch],
    queryFn: () =>
      fetchCommanders({
        limit,
        offset: 0,
        timePeriod,
        sortBy,
        minTournamentSize,
        search: debouncedSearch,
      }),
    placeholderData: keepPreviousData,
    initialData: isDefaultFilters ? initialData : undefined,
    // Skip initial fetch if we have initial data and filters are default
    staleTime: isDefaultFilters && initialData ? 1000 * 60 * 5 : 0,
  });

  const commanders = data?.commanders ?? [];
  const total = data?.total ?? 0;
  const displayedCommanders = commanders.slice(0, displayCount);
  const hasMore = displayCount < commanders.length || displayCount < total;

  const loadMore = () => {
    setDisplayCount((prev) => Math.min(prev + 24, commanders.length));
  };

  // Show skeleton on server and initial client render for hydration safety
  // But if we have initialData, we can show it immediately
  const hasInitialContent = initialData && isDefaultFilters;
  const showInitialLoading = !mounted || (isLoading && !hasInitialContent);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search commanders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
          <SelectTrigger className="w-40">
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

        <Select value={minTournamentSize} onValueChange={setMinTournamentSize}>
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
            ? "Loading commanders..." 
            : `Showing ${displayedCommanders.length} of ${total} commanders`}
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

      {/* Commander grid */}
      {!(mounted && error) && (
        <>
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${mounted && isFetching && !isLoading ? "opacity-60" : ""} transition-opacity duration-200`}>
            {showInitialLoading
              ? [...Array(8)].map((_, i) => <CommanderCardSkeleton key={i} />)
              : displayedCommanders.map((commander) => (
                  <CommanderCard
                    key={commander.id}
                    commander={commander}
                  />
                ))}
          </div>

          {/* Load more button */}
          {hasMore && !showInitialLoading && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={loadMore}
                variant="outline"
                size="lg"
              >
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
