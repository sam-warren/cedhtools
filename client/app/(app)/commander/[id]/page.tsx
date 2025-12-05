"use client";

import {
  OtherCardData,
  otherCardsColumns,
} from "@/components/deck-analysis/other-cards-columns";
import { DataTable } from "@/components/shared/data-table/data-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  Handshake, 
  PercentIcon, 
  Ticket, 
  Trophy, 
  XCircle, 
  ArrowLeft,
  Users
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SeatStat {
  seat: number;
  wins: number;
  entries: number;
  winRate: number;
}

interface CommanderData {
  commander: {
    id: string;
    name: string;
    wins: number;
    losses: number;
    draws: number;
    entries: number;
    winRate: number;
    seatStats: SeatStat[];
  };
  topCards: OtherCardData[];
  totalCards: number;
}

export default function CommanderPage() {
  const params = useParams();
  const router = useRouter();
  const commanderId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CommanderData | null>(null);
  const [minEntries, setMinEntries] = useState<number>(5);

  useEffect(() => {
    async function fetchCommanderData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/commanders/${commanderId}?topCards=100`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Commander not found");
          } else {
            const errorData = await response.json();
            setError(errorData.message || "Failed to load commander data");
          }
          return;
        }

        const commanderData = await response.json();
        setData(commanderData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    if (commanderId) {
      fetchCommanderData();
    }
  }, [commanderId]);

  const columns = data ? otherCardsColumns(data.commander.winRate) : [];

  if (loading) {
    return <CommanderPageSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Commander Not Found</CardTitle>
            <CardDescription>
              {error || "The commander you're looking for doesn't exist in our database."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <main className="flex-1 mt-6">
        {/* Commander Stats Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent font-mono">
              {data.commander.name}
            </CardTitle>
            <CardDescription>
              Tournament performance statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Overall Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-muted/80 p-4 rounded-lg border border-border/50 shadow-sm transition-all hover:shadow-md relative">
                <div className="absolute right-3 top-3">
                  <div className="bg-background p-2 rounded-full shadow-sm border border-border/70 hover:shadow-md transition-shadow">
                    <PercentIcon className="h-4 w-4 text-foreground" />
                  </div>
                </div>
                <p className="text-sm font-medium">Win Rate</p>
                <p className="text-2xl font-bold mt-1">
                  {data.commander.winRate.toFixed(1)}%
                </p>
              </div>
              <div className="bg-muted/80 p-4 rounded-lg border border-border/50 shadow-sm transition-all hover:shadow-md relative">
                <div className="absolute right-3 top-3">
                  <div className="bg-background p-2 rounded-full shadow-sm border border-border/70 hover:shadow-md transition-shadow">
                    <Trophy className="h-4 w-4 text-foreground" />
                  </div>
                </div>
                <p className="text-sm font-medium">Wins</p>
                <p className="text-2xl font-bold mt-1">
                  {data.commander.wins}
                </p>
              </div>
              <div className="bg-muted/80 p-4 rounded-lg border border-border/50 shadow-sm transition-all hover:shadow-md relative">
                <div className="absolute right-3 top-3">
                  <div className="bg-background p-2 rounded-full shadow-sm border border-border/70 hover:shadow-md transition-shadow">
                    <XCircle className="h-4 w-4 text-foreground" />
                  </div>
                </div>
                <p className="text-sm font-medium">Losses</p>
                <p className="text-2xl font-bold mt-1">
                  {data.commander.losses}
                </p>
              </div>
              <div className="bg-muted/80 p-4 rounded-lg border border-border/50 shadow-sm transition-all hover:shadow-md relative">
                <div className="absolute right-3 top-3">
                  <div className="bg-background p-2 rounded-full shadow-sm border border-border/70 hover:shadow-md transition-shadow">
                    <Handshake className="h-4 w-4 text-foreground" />
                  </div>
                </div>
                <p className="text-sm font-medium">Draws</p>
                <p className="text-2xl font-bold mt-1">
                  {data.commander.draws}
                </p>
              </div>
              <div className="bg-muted/80 p-4 rounded-lg border border-border/50 shadow-sm transition-all hover:shadow-md relative">
                <div className="absolute right-3 top-3">
                  <div className="bg-background p-2 rounded-full shadow-sm border border-border/70 hover:shadow-md transition-shadow">
                    <Ticket className="h-4 w-4 text-foreground" />
                  </div>
                </div>
                <p className="text-sm font-medium">Games</p>
                <p className="text-2xl font-bold mt-1">
                  {data.commander.entries}
                </p>
              </div>
            </div>

            {/* Seat Position Stats */}
            {data.commander.seatStats && data.commander.seatStats.some(s => s.entries > 0) && (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">Win Rate by Seat Position</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {data.commander.seatStats.map((seatStat) => (
                    <div 
                      key={seatStat.seat}
                      className="bg-muted/50 p-4 rounded-lg border border-border/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          Seat {seatStat.seat}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {seatStat.entries} games
                        </span>
                      </div>
                      <p className={`text-xl font-bold ${
                        seatStat.entries === 0 
                          ? 'text-muted-foreground' 
                          : seatStat.winRate > data.commander.winRate 
                            ? 'text-green-600 dark:text-green-400' 
                            : seatStat.winRate < data.commander.winRate 
                              ? 'text-red-600 dark:text-red-400' 
                              : ''
                      }`}>
                        {seatStat.entries > 0 ? `${seatStat.winRate.toFixed(1)}%` : 'N/A'}
                      </p>
                      {seatStat.entries > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {seatStat.wins} wins
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Cards Table */}
        {data.topCards && data.topCards.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Popular Cards</CardTitle>
              <CardDescription>
                Most commonly played cards with this commander
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={data.topCards}
                enableFiltering={true}
                globalFilter={true}
                filterableColumns={[]}
                enableMinEntriesFilter={true}
                minEntriesOptions={[5, 25, 50, 100]}
                defaultMinEntries={minEntries}
                onMinEntriesChange={setMinEntries}
              />
            </CardContent>
          </Card>
        )}

        {/* Back Button */}
        <div className="mt-8 flex justify-center">
          <Button variant="outline" onClick={() => router.push('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Search Another Commander
          </Button>
        </div>
      </main>
    </div>
  );
}

function CommanderPageSkeleton() {
  return (
    <div className="flex flex-col mt-6">
      <Card className="mb-8">
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="bg-muted p-4 rounded-lg">
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-8 w-1/4" />
                </div>
              ))}
          </div>
          <div className="mt-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array(4)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="bg-muted/50 p-4 rounded-lg">
                    <Skeleton className="h-4 w-16 mb-2" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-4 w-1/5" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
