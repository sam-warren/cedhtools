"use client";

import { fetchWithAuth } from "@/app/utils/api";
import { columns } from "@/components/deck-analysis/deck-card-columns";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Handshake, PercentIcon, Ticket, Trophy, XCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

// Type mapping for display purposes
const TYPE_NAMES: Record<string, string> = {
  "1": "Battle",
  "2": "Planeswalker",
  "3": "Creature",
  "4": "Sorcery",
  "5": "Instant",
  "6": "Artifact",
  "7": "Enchantment",
  "8": "Land",
  "0": "Unknown",
};

interface DeckData {
  deck: {
    id: string;
    name: string;
    commanders: {
      name: string;
      id: string;
    }[];
  };
  commanderStats?: {
    id: string;
    name: string;
    wins: number;
    losses: number;
    draws: number;
    entries: number;
    winRate: number;
  };
  cardsByType: Record<
    string,
    Array<{
      id: string;
      name: string;
      scryfallId: string;
      type: number;
      quantity: number;
      type_line: string | null;
      stats: {
        wins: number;
        losses: number;
        draws: number;
        entries: number;
        winRate: number;
        inclusionRate: number;
        winRateDiff: number;
      } | null;
    }>
  >;
  otherCards: OtherCardData[];
  error?: string;
}

export default function DeckPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deckData, setDeckData] = useState<DeckData | null>(null);

  useEffect(() => {
    const fetchDeck = async () => {
      try {
        setLoading(true);
        try {
          const data = await fetchWithAuth<DeckData>(`/api/decks/${params.id}`);
          setDeckData(data);
          setError(null);
        } catch (err) {
          // Error is already handled by fetchWithAuth
          if (err instanceof Error) {
            // For other errors, show the error message
            setError(err.message);
          } else {
            setError("An unexpected error occurred");
          }
          setDeckData(null);
        }
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchDeck();
    }
  }, [params.id]);

  // Sort card types by numeric order
  const cardTypes = deckData?.cardsByType
    ? Object.keys(deckData.cardsByType).sort(
        (a, b) => parseInt(a) - parseInt(b)
      )
    : [];

  // Group other cards by type
  const otherCardsByType = deckData?.otherCards
    ? deckData.otherCards.reduce((acc, card) => {
        const typeKey = card.type.toString();
        if (!acc[typeKey]) {
          acc[typeKey] = [];
        }
        acc[typeKey].push(card);
        return acc;
      }, {} as Record<string, OtherCardData[]>)
    : {};

  // Sort other card types by numeric order
  const otherCardTypes = deckData?.otherCards
    ? Object.keys(otherCardsByType).sort((a, b) => parseInt(a) - parseInt(b))
    : [];

  // If there's an error in the response, show the error message
  if (deckData?.error) {
    return (
      <Card className="mb-8 mt-6">
        <CardHeader>
          <CardTitle className="text-red-500">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{deckData.error}</p>
          <p className="mt-4">
            Please check the Moxfield deck ID and try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col">
      <main className="flex-1 mt-6">
        {loading ? (
          <DeckPageSkeleton />
        ) : error ? (
          error.toLowerCase().includes("authentication required") ? (
            // If it's an auth error, immediately redirect to login
            <RedirectToLogin />
          ) : (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-red-500">Error</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{error}</p>
                <p className="mt-4">
                  Please check the Moxfield deck ID and try again.
                </p>
              </CardContent>
            </Card>
          )
        ) : deckData ? (
          <>
            {/* Generate formatted commander name */}
            {(() => {
              // Get commander win rate
              const commanderWinRate = deckData.commanderStats?.winRate || 0;

              // Generate column definitions with commander data
              const deckColumns = columns(commanderWinRate);
              const otherColumns = otherCardsColumns(commanderWinRate);

              return (
                <>
                  <Card className="mb-8">
                    <CardHeader>
                      <CardTitle className="text-xl text-muted-foreground">
                        <a
                          href={`https://moxfield.com/decks/${deckData.deck.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline transition-all"
                        >
                          {deckData.deck.name}
                        </a>
                      </CardTitle>
                      <CardDescription className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent font-mono">
                        {deckData.deck.commanders
                          .map((c) => c.name)
                          .join(" + ")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {deckData.commanderStats ? (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div className="bg-muted/80 p-4 rounded-lg border border-border/50 shadow-sm transition-all hover:shadow-md relative">
                            <div className="absolute right-3 top-3">
                              <div className="bg-background p-2 rounded-full shadow-sm border border-border/70 hover:shadow-md transition-shadow">
                                <PercentIcon className="h-4 w-4 text-foreground" />
                              </div>
                            </div>
                            <p className="text-sm font-medium">Win Rate</p>
                            <p className="text-2xl font-bold mt-1">
                              {deckData.commanderStats.winRate.toFixed(1)}%
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
                              {deckData.commanderStats.wins}
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
                              {deckData.commanderStats.losses}
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
                              {deckData.commanderStats.draws}
                            </p>
                          </div>
                          <div className="bg-muted/80 p-4 rounded-lg border border-border/50 shadow-sm transition-all hover:shadow-md relative">
                            <div className="absolute right-3 top-3">
                              <div className="bg-background p-2 rounded-full shadow-sm border border-border/70 hover:shadow-md transition-shadow">
                                <Ticket className="h-4 w-4 text-foreground" />
                              </div>
                            </div>
                            <p className="text-sm font-medium">Entries</p>
                            <p className="text-2xl font-bold mt-1">
                              {deckData.commanderStats.entries}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-muted/80 p-6 rounded-lg border border-border/50 shadow-sm">
                          <p className="text-lg text-muted-foreground">
                            No tournament data available for this commander yet.
                            This could be because:
                          </p>
                          <ul className="list-disc list-inside mt-2 text-muted-foreground">
                            <li>
                              The commander hasn&apos;t appeared in any
                              tournaments yet
                            </li>
                            <li>
                              The commander is too new to have tournament data
                            </li>
                            <li>
                              The commander is not commonly played in
                              tournaments
                            </li>
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Cards in Deck section */}
                  {deckData.cardsByType &&
                    Object.keys(deckData.cardsByType).length > 0 && (
                      <Card className="mt-8">
                        <CardHeader>
                          <CardTitle>Cards in Deck</CardTitle>
                          <CardDescription>
                            Cards from your decklist with statistics
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Tabs defaultValue="all">
                            <TabsList
                              className="grid mb-4"
                              style={{
                                gridTemplateColumns: `repeat(${
                                  cardTypes.length + 1
                                }, minmax(0, 1fr))`,
                              }}
                            >
                              <TabsTrigger value="all">All Cards</TabsTrigger>
                              {cardTypes.map((typeId) => (
                                <TabsTrigger key={typeId} value={typeId}>
                                  {TYPE_NAMES[typeId] || `Type ${typeId}`}
                                </TabsTrigger>
                              ))}
                            </TabsList>

                            {/* "All" tab content - contains all cards */}
                            <TabsContent value="all">
                              <DataTable
                                columns={deckColumns}
                                data={Object.values(
                                  deckData.cardsByType
                                ).flat()}
                                enableFiltering={true}
                                globalFilter={true}
                                filterableColumns={[]}
                              />
                            </TabsContent>

                            {cardTypes.map((typeId) => (
                              <TabsContent key={typeId} value={typeId}>
                                <DataTable
                                  columns={deckColumns}
                                  data={deckData.cardsByType[typeId]}
                                  enableFiltering={true}
                                  globalFilter={true}
                                  filterableColumns={[]}
                                />
                              </TabsContent>
                            ))}
                          </Tabs>
                        </CardContent>
                      </Card>
                    )}

                  {/* Other Cards Table with Tabs */}
                  {deckData.otherCards && deckData.otherCards.length > 0 && (
                    <div className="mt-12">
                      <Card>
                        <CardHeader>
                          <CardTitle>Other Popular Cards</CardTitle>
                          <CardDescription>
                            Cards commonly played with this commander that are
                            not in your decklist
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Tabs defaultValue="all">
                            <TabsList
                              className="grid mb-4"
                              style={{
                                gridTemplateColumns: `repeat(${
                                  otherCardTypes.length + 1
                                }, minmax(0, 1fr))`,
                              }}
                            >
                              <TabsTrigger value="all">All Cards</TabsTrigger>
                              {otherCardTypes.map((typeId) => (
                                <TabsTrigger key={typeId} value={typeId}>
                                  {TYPE_NAMES[typeId] || `Type ${typeId}`}
                                </TabsTrigger>
                              ))}
                            </TabsList>

                            {/* "All" tab content for other cards */}
                            <TabsContent value="all">
                              <DataTable
                                columns={otherColumns}
                                data={deckData.otherCards}
                                enableFiltering={true}
                                globalFilter={true}
                                filterableColumns={[]}
                              />
                            </TabsContent>

                            {/* Type-specific tabs for other cards */}
                            {otherCardTypes.map((typeId) => (
                              <TabsContent key={typeId} value={typeId}>
                                <DataTable
                                  columns={otherColumns}
                                  data={otherCardsByType[typeId]}
                                  enableFiltering={true}
                                  globalFilter={true}
                                  filterableColumns={[]}
                                />
                              </TabsContent>
                            ))}
                          </Tabs>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </>
              );
            })()}
          </>
        ) : null}
      </main>
    </div>
  );
}

function DeckPageSkeleton() {
  return (
    <div>
      <Card className="mb-8">
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="bg-muted p-4 rounded-lg">
                  <Skeleton className="h-4 w-1/2 mb-2" />
                  <Skeleton className="h-8 w-1/4" />
                </div>
              ))}
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
