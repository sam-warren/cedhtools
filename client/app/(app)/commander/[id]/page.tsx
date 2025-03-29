"use client";

import { fetchWithAuth } from "@/app/utils/api";
import { CardData, columns } from "@/components/deck-analysis/deck-card-columns";
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
import { Handshake, PercentIcon, Ticket, Trophy, XCircle, Info } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

interface CommanderData {
  commander: {
    id: string;
    name: string;
    imageUrl?: string | null;
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
      type_line: string | null;
      quantity?: number;
      stats: {
        wins: number;
        losses: number;
        draws: number;
        entries: number;
        winRate: number;
        inclusionRate: number;
        winRateDiff: number;
        confidence?: number;
      } | null;
    }>
  >;
  error?: string;
}

export default function CommanderPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [commanderData, setCommanderData] = useState<CommanderData | null>(null);
  const [minEntries, setMinEntries] = useState<number>(5);

  useEffect(() => {
    const fetchCommander = async () => {
      try {
        setLoading(true);
        try {
          const data = await fetchWithAuth<CommanderData>(`/api/commanders/${params.id}`);
          setCommanderData(data);
        } catch {
          setCommanderData(null);
        }
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchCommander();
    }
  }, [params.id]);

  // Sort card types by numeric order
  const cardTypes = commanderData?.cardsByType
    ? Object.keys(commanderData.cardsByType).sort(
        (a, b) => parseInt(a) - parseInt(b)
      )
    : [];

  // If there's an error in the response, show the error message
  if (commanderData?.error) {
    return (
      <Card className="mb-8 mt-6">
        <CardHeader>
          <CardTitle className="text-red-500">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{commanderData.error}</p>
        </CardContent>
      </Card>
    );
  }

  // Transform data to ensure it has the necessary structure for CardData
  const transformCardData = (cards: CommanderData['cardsByType'][string]): CardData[] => {
    return cards.map(card => ({
      ...card,
      quantity: card.quantity || 1, // Default to 1 if quantity is missing
      stats: card.stats ? {
        ...card.stats,
        confidence: card.stats.confidence || 0, // Default to 0 if confidence is missing
      } : null
    }));
  };

  return (
    <div className="flex flex-col">
      <main className="flex-1 mt-6">
        {loading ? (
          <CommanderPageSkeleton />
        ) : commanderData ? (
          // Get commander win rate
          (() => {
            const commanderWinRate = commanderData.commanderStats?.winRate || 0;

            // Generate column definitions with commander data
            const tableColumns = columns(commanderWinRate);

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
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent font-mono">
                      {commanderData.commander.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {commanderData.commanderStats ? (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-muted/80 p-4 rounded-lg border border-border/50 shadow-sm transition-all hover:shadow-md relative">
                          <div className="absolute right-3 top-3">
                            <div className="bg-background p-2 rounded-full shadow-sm border border-border/70 hover:shadow-md transition-shadow">
                              <PercentIcon className="h-4 w-4 text-foreground" />
                            </div>
                          </div>
                          <p className="text-sm font-medium">Win Rate</p>
                          <p className="text-2xl font-bold mt-1">
                            {commanderData.commanderStats.winRate.toFixed(1)}%
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
                            {commanderData.commanderStats.wins}
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
                            {commanderData.commanderStats.losses}
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
                            {commanderData.commanderStats.draws}
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
                            {commanderData.commanderStats.entries}
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
                            The commander is not commonly played in tournaments
                          </li>
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Cards played with this commander */}
                {commanderData.cardsByType &&
                  Object.keys(commanderData.cardsByType).length > 0 && (
                    <Card className="mt-8">
                      <CardHeader>
                        <CardTitle>Cards Played with this Commander</CardTitle>
                        <CardDescription>
                          Cards commonly played with this commander in tournaments
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
                              columns={tableColumns}
                              data={transformCardData(Object.values(commanderData.cardsByType).flat())}
                              enableFiltering={true}
                              globalFilter={true}
                              filterableColumns={[]}
                              enableMinEntriesFilter={true}
                              minEntriesOptions={[5, 25, 50, 100]}
                              defaultMinEntries={minEntries}
                              onMinEntriesChange={setMinEntries}
                            />
                          </TabsContent>

                          {cardTypes.map((typeId) => (
                            <TabsContent key={typeId} value={typeId}>
                              <DataTable
                                columns={tableColumns}
                                data={transformCardData(commanderData.cardsByType[typeId])}
                                enableFiltering={true}
                                globalFilter={true}
                                filterableColumns={[]}
                                enableMinEntriesFilter={true}
                                minEntriesOptions={[5, 25, 50, 100]}
                                defaultMinEntries={minEntries}
                                onMinEntriesChange={setMinEntries}
                              />
                            </TabsContent>
                          ))}
                        </Tabs>
                      </CardContent>
                    </Card>
                  )}
              </>
            );
          })()
        ) : null}
      </main>
    </div>
  );
}

function CommanderPageSkeleton() {
  return (
    <div>
      <Card className="mb-8">
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Array(5)
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
