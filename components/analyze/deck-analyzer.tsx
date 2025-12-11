"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ColorIdentity } from "@/components/shared/color-identity";
import { RecentDecks } from "@/components/shared/recent-decks";
import { useDebounce } from "@/hooks/use-debounce";
import { useCommanderSearch, type CommanderSearchResult } from "@/hooks/use-queries";
import { parseDecklist, prepareForValidation } from "@/lib/parsers";
import { saveRecentDeck, saveAnalysis } from "@/lib/storage";
import type { AnalysisResponse } from "./analysis-results";
import {
  ChevronsUpDown,
  Check,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ValidationResult {
  valid: boolean;
  errors: string[];
  decklist: string;
  deckObj: Record<string, unknown>;
}

async function validateDecklist(decklist: string): Promise<ValidationResult> {
  const response = await fetch("/api/analyze/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decklist }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Validation failed");
  }

  return response.json();
}

// Default time period for initial analysis (user can change on results page)
const DEFAULT_TIME_PERIOD = "6_months";

async function analyzeDecklist(
  commanderName: string,
  cards: string[],
  timePeriod: string = DEFAULT_TIME_PERIOD
): Promise<AnalysisResponse> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ commanderName, cards, timePeriod }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Analysis failed");
  }

  return response.json();
}

const DECKLIST_PLACEHOLDER = `Paste your decklist here...

Format: Moxfield plaintext (1 Card Name)

Example:
1 Ancient Tomb
1 Arcane Signet
1 Chrome Mox
1 Mana Vault
...`;

export function DeckAnalyzer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [commanderOpen, setCommanderOpen] = useState(false);
  const [commanderSearch, setCommanderSearch] = useState("");
  const [selectedCommander, setSelectedCommander] = useState<CommanderSearchResult | null>(null);
  const [decklist, setDecklist] = useState("");

  const debouncedSearch = useDebounce(commanderSearch, 300);
  const { data: searchResults, isLoading: isSearching } = useCommanderSearch(debouncedSearch);

  // Pre-fill commander from URL params (e.g., from commander detail page)
  useEffect(() => {
    const commanderName = searchParams.get("commander");
    const commanderId = searchParams.get("commanderId");
    const colorId = searchParams.get("colorId");

    if (commanderName && commanderId && colorId) {
      setSelectedCommander({
        id: parseInt(commanderId, 10),
        name: commanderName,
        color_id: colorId,
        entries: 0, // Not needed for display
      });
    }
  }, [searchParams]);

  // Combined validation + analysis mutation
  const analysisMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCommander) {
        throw new Error("Please select a commander");
      }
      if (!decklist.trim()) {
        throw new Error("Please enter a decklist");
      }
      
      // Step 1: Validate the decklist with Scrollrack
      const preparedDecklist = prepareForValidation(decklist, selectedCommander.name);
      const validationResult = await validateDecklist(preparedDecklist);
      
      if (!validationResult.valid) {
        throw new Error(validationResult.errors.join("; "));
      }
      
      // Step 2: Parse the decklist to get card names
      const cards = parseDecklist(decklist);
      const cardNames = cards.map(card => card.name);
      
      // Step 3: Analyze the decklist
      const result = await analyzeDecklist(selectedCommander.name, cardNames);
      
      // Step 4: Save to recent decks and get the ID
      const deckId = saveRecentDeck(
        selectedCommander.name,
        selectedCommander.id,
        selectedCommander.color_id,
        decklist,
        cardNames
      );
      
      // Step 5: Save analysis results
      if (deckId) {
        saveAnalysis(deckId, result);
      }
      
      return { result, deckId };
    },
    onSuccess: ({ deckId }) => {
      // Navigate to the analysis page
      if (deckId) {
        router.push(`/analyze/${deckId}`);
      }
    },
  });

  const handleAnalyze = () => {
    analysisMutation.mutate();
  };

  const commanders = searchResults?.commanders ?? [];

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-6">
          Deck Analysis
        </h1>
        <p className="text-lg text-muted-foreground">
          Select your commander and paste your decklist. We&apos;ll validate it
          against tournament statistics and compare your card choices to winning lists.
        </p>
      </div>

      {/* Recent Decks */}
      <RecentDecks className="pb-4 border-b" />

      {/* Commander Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Commander</label>
        <Popover open={commanderOpen} onOpenChange={setCommanderOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={commanderOpen}
              className="w-full justify-between h-auto min-h-10 py-2"
            >
              {selectedCommander ? (
                <div className="flex items-center gap-2 text-left">
                  <ColorIdentity colorId={selectedCommander.color_id} size="sm" />
                  <span className="truncate">{selectedCommander.name}</span>
                </div>
              ) : (
                <span className="text-muted-foreground">Search commanders...</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search commanders..."
                value={commanderSearch}
                onValueChange={setCommanderSearch}
              />
              <CommandList>
                {commanderSearch.length < 2 ? (
                  <CommandEmpty>
                    Type at least 2 characters to search...
                  </CommandEmpty>
                ) : isSearching ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                ) : commanders.length === 0 ? (
                  <CommandEmpty>
                    No commanders found.
                  </CommandEmpty>
                ) : (
                  <CommandGroup>
                    {commanders.map((commander) => (
                      <CommandItem
                        key={commander.id}
                        value={commander.name}
                        onSelect={() => {
                          setSelectedCommander(commander);
                          setCommanderOpen(false);
                          setCommanderSearch("");
                        }}
                        className="flex items-center gap-2"
                      >
                        <Check
                          className={cn(
                            "h-4 w-4",
                            selectedCommander?.id === commander.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <ColorIdentity colorId={commander.color_id} size="sm" />
                        <span className="truncate">{commander.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Decklist Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Decklist</label>
        <Textarea
          placeholder={DECKLIST_PLACEHOLDER}
          value={decklist}
          onChange={(e) => setDecklist(e.target.value)}
          className="h-[180px] resize-y font-mono text-sm"
        />
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleAnalyze}
        disabled={!selectedCommander || !decklist.trim() || analysisMutation.isPending}
        className="bg-foreground text-background hover:opacity-90"
      >
        {analysisMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            Analyze Deck
            <ArrowRight className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>

      {/* Error Display */}
      {analysisMutation.isError && (
        <div className="flex items-start gap-3 p-4 border border-destructive/50 bg-destructive/5 rounded-md">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-destructive">Error</p>
            <div className="text-sm text-muted-foreground mt-1 space-y-1">
              {analysisMutation.error instanceof Error
                ? analysisMutation.error.message.split("; ").map((err, i) => (
                    <p key={i}>{err}</p>
                  ))
                : <p>An unexpected error occurred</p>}
            </div>
          </div>
        </div>
      )}

      {/* Info section */}
      <section className="border-t pt-8 mt-12">
        <p className="text-sm text-muted-foreground">
          Deck validation powered by{" "}
          <a
            href="https://topdeck.gg"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            TopDeck.gg
          </a>
          . Analysis based on tournament data from competitive EDH events.
        </p>
      </section>
    </div>
  );
}
