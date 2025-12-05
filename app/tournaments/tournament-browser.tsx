"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Users,
  Trophy,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
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

const timeOptions: { value: TimePeriod; label: string }[] = [
  { value: "1_month", label: "Past Month" },
  { value: "3_months", label: "Past 3 Months" },
  { value: "6_months", label: "Past 6 Months" },
  { value: "1_year", label: "Past Year" },
];

export function TournamentBrowser() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("1_month");
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchTournaments = async (append = false) => {
    try {
      setLoading(true);
      setError(null);

      const currentOffset = append ? offset : 0;

      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(currentOffset),
        timePeriod,
      });

      const response = await fetch(`/api/tournaments?${params}`);
      if (!response.ok) throw new Error("Failed to fetch tournaments");

      const data = await response.json();

      if (append) {
        setTournaments((prev) => [...prev, ...data.tournaments]);
      } else {
        setTournaments(data.tournaments);
      }

      setTotal(data.total);
      setOffset(currentOffset + data.tournaments.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setOffset(0);
    fetchTournaments(false);
  }, [timePeriod]);

  const hasMore = tournaments.length < total;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
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

      {/* Results count */}
      <p className="text-sm text-muted-foreground mb-4">
        Showing {tournaments.length} of {total} tournaments
      </p>

      {/* Error state */}
      {error && (
        <div className="text-center py-8">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => fetchTournaments()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      )}

      {/* Tournament list */}
      {!error && (
        <div className="space-y-4">
          {tournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} formatDate={formatDate} />
          ))}

          {loading &&
            [...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}

          {!loading && tournaments.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No tournaments found for the selected time period.
              </CardContent>
            </Card>
          )}

          {hasMore && !loading && (
            <div className="flex justify-center mt-6">
              <Button onClick={() => fetchTournaments(true)} variant="outline">
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
              <span className="flex items-center gap-1">
                <Trophy className="w-4 h-4" />
                Top {tournament.top_cut}
              </span>
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
