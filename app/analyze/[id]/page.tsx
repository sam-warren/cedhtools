"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { AnalysisResults, AnalysisResultsSkeleton, type AnalysisResponse } from "@/components/analyze/analysis-results";
import { useDeckAnalysis } from "@/hooks/use-queries";
import { getDeckById, getAnalysis, saveAnalysis } from "@/lib/storage";
import { parseDecklist, prepareForValidation } from "@/lib/parsers";
import { useTimePeriod } from "@/lib/contexts/time-period-context";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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

export default function AnalysisPage() {
  const params = useParams();
  const deckId = params.id as string;
  
  const [mounted, setMounted] = useState(false);
  const [deckNotFound, setDeckNotFound] = useState(false);
  const { timePeriod, setTimePeriod } = useTimePeriod();
  
  // Store validated deck data for query-based fetching
  const [validatedDeck, setValidatedDeck] = useState<{
    commanderName: string;
    cardNames: string[];
  } | null>(null);

  // Initial validation mutation - runs once to validate and parse the decklist
  const validationMutation = useMutation({
    mutationFn: async (deck: { commanderName: string; decklist: string }) => {
      // Validate the decklist with Scrollrack
      const preparedDecklist = prepareForValidation(deck.decklist, deck.commanderName);
      const validationResult = await validateDecklist(preparedDecklist);
      
      if (!validationResult.valid) {
        throw new Error(validationResult.errors.join("; "));
      }
      
      // Parse the decklist to get card names
      const cards = parseDecklist(deck.decklist);
      const cardNames = cards.map(card => card.name);
      
      return { commanderName: deck.commanderName, cardNames };
    },
    onSuccess: (data) => {
      setValidatedDeck(data);
    },
  });

  // Use query-based hook for analysis with smooth time period transitions
  const {
    data: analysisData,
    isLoading: analysisLoading,
    isFetching: analysisFetching,
    error: analysisError,
  } = useDeckAnalysis(
    validatedDeck?.commanderName ?? "",
    validatedDeck?.cardNames ?? [],
    timePeriod,
    !!validatedDeck // Only enabled once we have validated deck data
  );

  // Save analysis to localStorage when it changes
  useEffect(() => {
    if (analysisData && deckId) {
      saveAnalysis(deckId, analysisData);
    }
  }, [analysisData, deckId]);

  // Load deck from localStorage on mount
  useEffect(() => {
    setMounted(true);
    
    const deck = getDeckById(deckId);
    if (!deck) {
      setDeckNotFound(true);
      return;
    }
    
    // Check for cached analysis first (for instant display)
    const cached = getAnalysis(deckId);
    if (cached) {
      // Parse the decklist to get card names for the query hook
      const cards = parseDecklist(deck.decklist);
      const cardNames = cards.map(card => card.name);
      setValidatedDeck({ commanderName: deck.commanderName, cardNames });
    } else {
      // Need to validate first
      validationMutation.mutate({ 
        commanderName: deck.commanderName, 
        decklist: deck.decklist 
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  // Don't render until mounted (client-side only)
  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-12 md:py-16">
        <AnalysisResultsSkeleton />
      </div>
    );
  }

  // Deck not found
  if (deckNotFound) {
    return (
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl font-medium mb-4">Deck Not Found</h1>
          <p className="text-muted-foreground mb-8">
            This deck analysis doesn&apos;t exist or has been removed from your browser&apos;s storage.
          </p>
          <Link href="/analyze">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Analyze a New Deck
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Initial validation in progress
  if (validationMutation.isPending) {
    return (
      <div className="container mx-auto px-4 py-12 md:py-16">
        <AnalysisResultsSkeleton />
      </div>
    );
  }

  // Validation error
  if (validationMutation.isError) {
    return (
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-start gap-3 p-4 border border-destructive/50 bg-destructive/5 rounded-md mb-8">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Validation Failed</p>
              <div className="text-sm text-muted-foreground mt-1 space-y-1">
                {validationMutation.error instanceof Error
                  ? validationMutation.error.message.split("; ").map((err, i) => (
                      <p key={i}>{err}</p>
                    ))
                  : <p>An unexpected error occurred</p>}
              </div>
            </div>
          </div>
          <Link href="/analyze">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Analyze
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Initial analysis loading (no data yet)
  if (analysisLoading && !analysisData) {
    return (
      <div className="container mx-auto px-4 py-12 md:py-16">
        <AnalysisResultsSkeleton />
      </div>
    );
  }

  // Analysis error (and no cached data to show)
  if (analysisError && !analysisData) {
    return (
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-start gap-3 p-4 border border-destructive/50 bg-destructive/5 rounded-md mb-8">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Analysis Failed</p>
              <div className="text-sm text-muted-foreground mt-1 space-y-1">
                {analysisError instanceof Error
                  ? analysisError.message.split("; ").map((err, i) => (
                      <p key={i}>{err}</p>
                    ))
                  : <p>An unexpected error occurred</p>}
              </div>
            </div>
          </div>
          <Link href="/analyze">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Analyze
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Show analysis results (with fade effect when fetching new time period)
  if (analysisData) {
    return (
      <div className="container mx-auto px-4 py-12 md:py-16">
        <AnalysisResults 
          data={analysisData} 
          isFetching={analysisFetching}
        />
      </div>
    );
  }

  // Fallback loading
  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <AnalysisResultsSkeleton />
    </div>
  );
}
