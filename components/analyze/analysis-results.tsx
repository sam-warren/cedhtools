"use client";

import { ColorIdentity } from "@/components/shared/color-identity";
import { DataTable, createStapleCardsColumns } from "@/components/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";
import type { CardWithStats } from "@/types/api";
import {
  Info,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

// Types for analysis response
interface AnalysisCommander {
  id: number;
  name: string;
  color_id: string;
  entries: number;
  entries_with_decklists: number;
  win_rate: number;
  conversion_score: number;
  wins: number;
  draws: number;
  losses: number;
  top_cuts: number;
}

interface DeckStats {
  total_cards: number;
  cards_with_data: number;
  cards_without_data: number;
  avg_play_rate: number;
  avg_win_rate_delta: number;
  avg_conversion_delta: number;
}

interface CardWithAnalysis extends CardWithStats {
  in_deck: boolean;
}

export interface AnalysisResponse {
  commander: AnalysisCommander;
  deck_stats: DeckStats;
  deck_cards: CardWithAnalysis[];
  missing_staples: CardWithAnalysis[];
  potential_cuts: CardWithAnalysis[];
  strong_cards: CardWithAnalysis[];
  unknown_cards: string[];
}

interface AnalysisResultsProps {
  data: AnalysisResponse;
}

/**
 * Format a delta value with +/- sign
 */
function formatDelta(value: number, decimals: number = 2): string {
  const formatted = value.toFixed(decimals);
  const isZero = parseFloat(formatted) === 0;
  if (isZero) return (0).toFixed(decimals);
  return (value > 0 ? "+" : "") + formatted;
}

export function AnalysisResults({ data }: AnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState<"deck" | "missing">("deck");
  
  const { commander, deck_stats, deck_cards, missing_staples, potential_cuts, strong_cards, unknown_cards } = data;

  // Scroll to top when results are displayed
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const commanderNames = commander.name.split(" / ");
  const commanderImages = commanderNames.map((name) => ({
    name: name.trim(),
    url: `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name.trim())}&format=image&version=normal`,
  }));

  const winRatePercent = (commander.win_rate * 100).toFixed(1);

  // Create columns that link to the card/commander page
  const deckCardsColumns = useMemo(
    () => createStapleCardsColumns(commander.id),
    [commander.id]
  );

  // Find hidden gems: cards with lower play rate but positive performance
  const hiddenGems = useMemo(() => {
    return deck_cards
      .filter(c => 
        c.entries >= 10 && 
        c.play_rate < 0.4 && 
        c.play_rate >= 0.1 &&
        c.win_rate_delta > 0.01
      )
      .sort((a, b) => b.win_rate_delta - a.win_rate_delta)
      .slice(0, 10);
  }, [deck_cards]);

  // Score for the deck based on avg deltas
  const deckScore = useMemo(() => {
    // Weighted score: 60% win rate delta, 40% conversion delta
    const wrScore = deck_stats.avg_win_rate_delta * 100 * 0.6;
    const convScore = deck_stats.avg_conversion_delta * 0.4;
    return wrScore + convScore;
  }, [deck_stats]);

  const getDeckScoreLabel = () => {
    if (deckScore > 2) return { label: "Optimized", color: "text-green-500" };
    if (deckScore > 0.5) return { label: "Strong", color: "text-green-400" };
    if (deckScore > -0.5) return { label: "Average", color: "text-muted-foreground" };
    if (deckScore > -2) return { label: "Suboptimal", color: "text-orange-400" };
    return { label: "Needs Work", color: "text-red-500" };
  };

  const scoreInfo = getDeckScoreLabel();

  return (
    <div className="space-y-12">
      {/* Hero Section - Similar to commander detail */}
      <section className="flex flex-col lg:flex-row gap-10">
        {/* Commander Image(s) */}
        <div className="relative shrink-0" style={{ width: commanderImages.length > 1 ? "260px" : "180px" }}>
          {commanderImages.map((img, index) => (
            <div
              key={img.name}
              className="absolute rounded-lg overflow-hidden shadow-2xl bg-muted"
              style={{
                width: commanderImages.length > 1 ? "160px" : "180px",
                aspectRatio: "488/680",
                left: index === 0 ? 0 : "100px",
                zIndex: commanderImages.length - index,
                transform: index > 0 ? "rotate(4deg)" : undefined,
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
          <div style={{ aspectRatio: "488/680", width: commanderImages.length > 1 ? "160px" : "180px" }} />
        </div>

        {/* Commander Info */}
        <div className="flex-1 space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <ColorIdentity colorId={commander.color_id} size="lg" />
              <Link 
                href={`/commanders/${encodeURIComponent(commander.name)}`}
                className="text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                View commander page →
              </Link>
            </div>
            <h1 className="text-3xl md:text-4xl font-medium tracking-tight">{commander.name}</h1>
            <p className="text-muted-foreground mt-2">Deck Analysis</p>
          </div>

          {/* Deck Score */}
          <div className="flex flex-wrap gap-x-12 gap-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Deck Rating</p>
              <p className={cn("text-2xl font-medium", scoreInfo.color)}>
                {scoreInfo.label}
              </p>
              <p className="text-xs text-muted-foreground">Based on card performance</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Cards Analyzed</p>
              <p className="text-2xl font-medium tabular-nums">{deck_stats.cards_with_data}</p>
              <p className="text-xs text-muted-foreground">of {deck_stats.total_cards} total</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Avg Win Rate Δ</p>
              <p className={cn(
                "text-2xl font-medium tabular-nums",
                deck_stats.avg_win_rate_delta > 0.005 ? "stat-positive" :
                deck_stats.avg_win_rate_delta < -0.005 ? "stat-negative" : ""
              )}>
                {formatDelta(deck_stats.avg_win_rate_delta * 100, 2)}%
              </p>
              <p className="text-xs text-muted-foreground">vs commander average</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Commander Win Rate</p>
              <p className="text-2xl font-medium tabular-nums">{winRatePercent}%</p>
              <p className="text-xs text-muted-foreground">{commander.entries} tournament decks</p>
            </div>
          </div>
        </div>
      </section>

      {/* Insights Section */}
      {(strong_cards.length > 0 || potential_cuts.length > 0 || missing_staples.length > 0 || hiddenGems.length > 0) && (
        <section className="border-t pt-10">
          <h2 className="text-lg font-medium mb-6">Quick Insights</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Strong Cards */}
            {strong_cards.length > 0 && (
              <div className="border rounded-lg p-5 space-y-4">
                <h3 className="font-medium">High Performers</h3>
                <p className="text-sm text-muted-foreground">
                  Popular cards with above-average win rates
                </p>
                <ul className="space-y-2">
                  {strong_cards.slice(0, 5).map((card) => (
                    <li key={card.id} className="flex items-center justify-between text-sm">
                      <Link 
                        href={`/cards/${encodeURIComponent(card.name)}/commanders/${commander.id}`}
                        className="hover:underline hover:text-primary truncate flex-1"
                      >
                        {card.name}
                      </Link>
                      <span className="text-green-500 tabular-nums ml-2">
                        {formatDelta(card.win_rate_delta * 100)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Hidden Gems */}
            {hiddenGems.length > 0 && (
              <div className="border rounded-lg p-5 space-y-4">
                <h3 className="font-medium">Hidden Gems</h3>
                <p className="text-sm text-muted-foreground">
                  Lower play rate but outperforming expectations
                </p>
                <ul className="space-y-2">
                  {hiddenGems.slice(0, 5).map((card) => (
                    <li key={card.id} className="flex items-center justify-between text-sm">
                      <Link 
                        href={`/cards/${encodeURIComponent(card.name)}/commanders/${commander.id}`}
                        className="hover:underline hover:text-primary truncate flex-1"
                      >
                        {card.name}
                      </Link>
                      <span className="text-green-500 tabular-nums ml-2">
                        {formatDelta(card.win_rate_delta * 100)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Potential Cuts */}
            {potential_cuts.length > 0 && (
              <div className="border rounded-lg p-5 space-y-4">
                <h3 className="font-medium">Consider Cutting</h3>
                <p className="text-sm text-muted-foreground">
                  Low play rate and below-average win rates
                </p>
                <ul className="space-y-2">
                  {potential_cuts.slice(0, 5).map((card) => (
                    <li key={card.id} className="flex items-center justify-between text-sm">
                      <Link 
                        href={`/cards/${encodeURIComponent(card.name)}/commanders/${commander.id}`}
                        className="hover:underline hover:text-primary truncate flex-1"
                      >
                        {card.name}
                      </Link>
                      <span className="text-xs text-muted-foreground ml-2">
                        {(card.play_rate * 100).toFixed(0)}% play
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Missing Staples */}
            {missing_staples.length > 0 && (
              <div className="border rounded-lg p-5 space-y-4">
                <h3 className="font-medium">Popular Cards Missing</h3>
                <p className="text-sm text-muted-foreground">
                  High play rate cards not in your deck
                </p>
                <ul className="space-y-2">
                  {missing_staples.slice(0, 5).map((card) => (
                    <li key={card.id} className="flex items-center justify-between text-sm">
                      <Link 
                        href={`/cards/${encodeURIComponent(card.name)}/commanders/${commander.id}`}
                        className="hover:underline hover:text-primary truncate flex-1"
                      >
                        {card.name}
                      </Link>
                      <span className="text-xs text-muted-foreground ml-2">
                        {(card.play_rate * 100).toFixed(0)}% play
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Card Tables Section */}
      <section className="border-t pt-10">
        {/* Tab Navigation */}
        <div className="flex items-center gap-6 mb-6">
          <button
            onClick={() => setActiveTab("deck")}
            className={cn(
              "pb-2 border-b-2 transition-colors",
              activeTab === "deck"
                ? "border-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Your Deck ({deck_cards.length})
          </button>
          <button
            onClick={() => setActiveTab("missing")}
            className={cn(
              "pb-2 border-b-2 transition-colors",
              activeTab === "missing"
                ? "border-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Missing Staples ({missing_staples.length})
          </button>
        </div>

        {/* Your Deck Cards */}
        {activeTab === "deck" && (
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Cards in your deck with tournament statistics. Delta values show performance vs commander average.
            </p>
            {deck_cards.length > 0 ? (
              <DataTable
                columns={deckCardsColumns}
                data={deck_cards}
                enableMinEntriesFilter
                minEntriesOptions={[5, 10, 25, 50, 100]}
                defaultMinEntries={5}
                getRowEntries={(row) => row.entries}
                defaultPageSize={20}
                globalFilter
              />
            ) : (
              <p className="text-muted-foreground py-8">
                No matching cards found in the database.
              </p>
            )}
            
            {/* Unknown Cards */}
            {unknown_cards.length > 0 && (
              <div className="mt-8 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Cards Without Data ({unknown_cards.length})</p>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  These cards weren&apos;t found in our tournament database. They may be new releases, typos, or rarely played.
                </p>
                <div className="flex flex-wrap gap-2">
                  {unknown_cards.slice(0, 20).map((name, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-muted rounded">
                      {name}
                    </span>
                  ))}
                  {unknown_cards.length > 20 && (
                    <span className="text-xs text-muted-foreground">
                      +{unknown_cards.length - 20} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Missing Staples */}
        {activeTab === "missing" && (
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Popular cards for this commander that aren&apos;t in your deck. Consider these as potential additions.
            </p>
            {missing_staples.length > 0 ? (
              <DataTable
                columns={deckCardsColumns}
                data={missing_staples}
                enableMinEntriesFilter
                minEntriesOptions={[5, 10, 25, 50, 100]}
                defaultMinEntries={5}
                getRowEntries={(row) => row.entries}
                defaultPageSize={20}
                globalFilter
              />
            ) : (
              <p className="text-muted-foreground py-8">
                Your deck includes all the popular staples!
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export function AnalysisResultsSkeleton() {
  return (
    <div className="space-y-12">
      <div className="flex flex-col lg:flex-row gap-10">
        <Skeleton className="w-[180px] aspect-488/680 rounded-lg shrink-0" />
        <div className="flex-1 space-y-6">
          <div>
            <Skeleton className="h-6 w-32 mb-3" />
            <Skeleton className="h-10 w-80 max-w-full" />
            <Skeleton className="h-5 w-24 mt-2" />
          </div>
          <div className="flex flex-wrap gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t pt-10">
        <Skeleton className="h-6 w-32 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border rounded-lg p-5 space-y-3">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-full" />
              <div className="space-y-2 pt-2">
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-10">
        <Skeleton className="h-6 w-40 mb-6" />
        <Skeleton className="h-[400px] w-full rounded-md" />
      </div>
    </div>
  );
}

