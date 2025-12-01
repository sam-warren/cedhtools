"use client";

import { CardData, columns } from "@/components/deck-analysis/deck-card-columns";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Handshake, PercentIcon, Ticket, Trophy, XCircle, Info, AlertTriangle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
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
    name: string;
    commanders: {
      name: string;
      id: string;
    }[];
  };
  commanderStats: {
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
        confidence: number;
      } | null;
    }>
  >;
  otherCards: OtherCardData[];
  notFoundCards?: string[];
}

export default function DeckAnalysisPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [deckData, setDeckData] = useState<DeckData | null>(null);
  const [deckMinEntries, setDeckMinEntries] = useState<number>(5);
  const [otherMinEntries, setOtherMinEntries] = useState<number>(5);

  useEffect(() => {
    // Get analysis data from session storage
    const storedData = sessionStorage.getItem('deckAnalysis');
    
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setDeckData(data);
      } catch {
        setDeckData(null);
      }
    }
    
    setLoading(false);
  }, []);

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

  // No data found
  if (!loading && !deckData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Analysis Data</CardTitle>
            <CardDescription>
              It looks like you haven&apos;t analyzed a deck yet, or the session has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Home to Analyze a Deck
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <main className="flex-1 mt-6">
        {loading ? (
          <DeckPageSkeleton />
        ) : deckData ? (
          (() => {
            const commanderWinRate = deckData.commanderStats?.winRate || 0;
            const deckColumns = columns(commanderWinRate);
            const otherColumns = otherCardsColumns(commanderWinRate);

            return (
              <>
                <Alert className="mb-8 bg-blue-50/50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">Important Disclaimer</p>
                    <p>
                      This data is meant as a guide and should be taken with a grain of salt. Due to limited quantity of data, statistical significance is low across the board. For more information about data considerations and limitations, please visit the{" "}
                      <a href="/about" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                        About page
                      </a>
                      .
                    </p>
                  </AlertDescription>
                </Alert>

                {/* Not Found Cards Warning */}
                {deckData.notFoundCards && deckData.notFoundCards.length > 0 && (
                  <Alert className="mb-8 bg-yellow-50/50 dark:bg-yellow-950/50 border-yellow-200 dark:border-yellow-800">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                      <p className="font-medium mb-1">Some cards could not be found</p>
                      <p className="text-sm">
                        The following cards were not recognized: {deckData.notFoundCards.join(', ')}
                      </p>
                    </AlertDescription>
                  </Alert>
                )}

                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="text-xl text-muted-foreground">
                      {deckData.deck.name}
                    </CardTitle>
                    <CardDescription className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent font-mono">
                      {deckData.deck.commanders.map((c) => c.name).join(" + ")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
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

                          <TabsContent value="all">
                            <DataTable
                              columns={deckColumns}
                              data={Object.values(deckData.cardsByType).flat() as CardData[]}
                              enableFiltering={true}
                              globalFilter={true}
                              filterableColumns={[]}
                              enableMinEntriesFilter={true}
                              minEntriesOptions={[5, 25, 50, 100]}
                              defaultMinEntries={deckMinEntries}
                              onMinEntriesChange={setDeckMinEntries}
                            />
                          </TabsContent>

                          {cardTypes.map((typeId) => (
                            <TabsContent key={typeId} value={typeId}>
                              <DataTable
                                columns={deckColumns}
                                data={deckData.cardsByType[typeId] as CardData[]}
                                enableFiltering={true}
                                globalFilter={true}
                                filterableColumns={[]}
                                enableMinEntriesFilter={true}
                                minEntriesOptions={[5, 25, 50, 100]}
                                defaultMinEntries={deckMinEntries}
                                onMinEntriesChange={setDeckMinEntries}
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
                          Cards commonly played with this commander that are not
                          in your decklist
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

                          <TabsContent value="all">
                            <DataTable
                              columns={otherColumns}
                              data={deckData.otherCards}
                              enableFiltering={true}
                              globalFilter={true}
                              filterableColumns={[]}
                              enableMinEntriesFilter={true}
                              minEntriesOptions={[5, 25, 50, 100]}
                              defaultMinEntries={otherMinEntries}
                              onMinEntriesChange={setOtherMinEntries}
                            />
                          </TabsContent>

                          {otherCardTypes.map((typeId) => (
                            <TabsContent key={typeId} value={typeId}>
                              <DataTable
                                columns={otherColumns}
                                data={otherCardsByType[typeId]}
                                enableFiltering={true}
                                globalFilter={true}
                                filterableColumns={[]}
                                enableMinEntriesFilter={true}
                                minEntriesOptions={[5, 25, 50, 100]}
                                defaultMinEntries={otherMinEntries}
                                onMinEntriesChange={setOtherMinEntries}
                              />
                            </TabsContent>
                          ))}
                        </Tabs>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Back Button */}
                <div className="mt-8 flex justify-center">
                  <Button variant="outline" onClick={() => router.push('/')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Analyze Another Deck
                  </Button>
                </div>
              </>
            );
          })()
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

