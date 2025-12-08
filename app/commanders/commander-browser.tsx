"use client";

import { CommanderCard, CommanderCardSkeleton } from "@/components/commander-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CommanderListItem, SortBy, TimePeriod } from "@/types/api";
import { RefreshCw, Search } from "lucide-react";
import { useEffect, useState } from "react";

const sortOptions: { value: SortBy; label: string }[] = [
  { value: "popularity", label: "Popularity" },
  { value: "conversion", label: "Conversion Rate" },
  { value: "win_rate", label: "Win Rate" },
];

const timeOptions: { value: TimePeriod; label: string }[] = [
  { value: "1_month", label: "Past Month" },
  { value: "3_months", label: "Past 3 Months" },
  { value: "6_months", label: "Past 6 Months" },
  { value: "1_year", label: "Past Year" },
  { value: "all_time", label: "All Time" },
];

const sizeOptions: { value: string; label: string }[] = [
  { value: "0", label: "All Events" },
  { value: "16", label: "16+ Players" },
  { value: "32", label: "32+ Players" },
  { value: "60", label: "60+ Players" },
];

export function CommanderBrowser() {
  const [commanders, setCommanders] = useState<CommanderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  // Filters
  const [sortBy, setSortBy] = useState<SortBy>("popularity");
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("3_months");
  const [minTournamentSize, setMinTournamentSize] = useState("0");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [offset, setOffset] = useState(0);
  const limit = 24;

  const fetchCommanders = async (append = false) => {
    try {
      setLoading(true);
      setError(null);

      const currentOffset = append ? offset : 0;

      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(currentOffset),
        timePeriod,
        sortBy,
        minEntries: "5",
        minTournamentSize,
      });

      if (searchQuery) params.set("search", searchQuery);

      const response = await fetch(`/api/commanders?${params}`);
      if (!response.ok) throw new Error("Failed to fetch commanders");

      const data = await response.json();

      if (append) {
        setCommanders((prev) => [...prev, ...data.commanders]);
      } else {
        setCommanders(data.commanders);
      }

      setTotal(data.total);
      setOffset(currentOffset + data.commanders.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setOffset(0);
    fetchCommanders(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, timePeriod, minTournamentSize, searchQuery]);

  const hasMore = commanders.length < total;

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
            {timeOptions.map((opt) => (
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
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground mb-4">
        Showing {commanders.length} of {total} commanders
      </p>

      {/* Error state */}
      {error && (
        <div className="text-center py-8">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => fetchCommanders()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      )}

      {/* Commander grid */}
      {!error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {commanders.map((commander, index) => (
              <CommanderCard
                key={commander.id}
                commander={commander}
                rank={index + 1}
              />
            ))}

            {loading &&
              [...Array(8)].map((_, i) => <CommanderCardSkeleton key={i} />)}
          </div>

          {/* Load more button */}
          {hasMore && !loading && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={() => fetchCommanders(true)}
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
