"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { AnalysisResults, AnalysisResultsSkeleton, type AnalysisResponse } from "../analysis-results";
import { getDeckById, getAnalysis, saveAnalysis } from "@/lib/recent-decks";
import { parseDecklist, prepareForValidation } from "@/lib/decklist-parser";
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

async function analyzeDecklist(
  commanderName: string,
  cards: string[]
): Promise<AnalysisResponse> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ commanderName, cards }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Analysis failed");
  }

  return response.json();
}

export default function AnalysisPage() {
  const params = useParams();
  const deckId = params.id as string;
  
  const [mounted, setMounted] = useState(false);
  const [cachedAnalysis, setCachedAnalysis] = useState<AnalysisResponse | null>(null);
  const [deckNotFound, setDeckNotFound] = useState(false);

  const analysisMutation = useMutation({
    mutationFn: async (deck: { commanderName: string; decklist: string }) => {
      // Step 1: Validate the decklist with Scrollrack
      const preparedDecklist = prepareForValidation(deck.decklist, deck.commanderName);
      const validationResult = await validateDecklist(preparedDecklist);
      
      if (!validationResult.valid) {
        throw new Error(validationResult.errors.join("; "));
      }
      
      // Step 2: Parse the decklist to get card names
      const parsed = parseDecklist(deck.decklist);
      const cardNames = parsed.mainboard.map(card => card.name);
      
      // Step 3: Analyze the decklist
      return analyzeDecklist(deck.commanderName, cardNames);
    },
    onSuccess: (data) => {
      // Save analysis to localStorage
      saveAnalysis(deckId, data);
      setCachedAnalysis(data);
    },
  });

  // Load deck and cached analysis from localStorage
  useEffect(() => {
    setMounted(true);
    
    const deck = getDeckById(deckId);
    if (!deck) {
      setDeckNotFound(true);
      return;
    }
    
    // Check for cached analysis
    const cached = getAnalysis(deckId);
    if (cached) {
      setCachedAnalysis(cached);
    } else {
      // Trigger fresh analysis
      analysisMutation.mutate(deck);
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

  // Loading state
  if (analysisMutation.isPending) {
    return (
      <div className="container mx-auto px-4 py-12 md:py-16">
        <AnalysisResultsSkeleton />
      </div>
    );
  }

  // Error state
  if (analysisMutation.isError) {
    return (
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-start gap-3 p-4 border border-destructive/50 bg-destructive/5 rounded-md mb-8">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Analysis Failed</p>
              <div className="text-sm text-muted-foreground mt-1 space-y-1">
                {analysisMutation.error instanceof Error
                  ? analysisMutation.error.message.split("; ").map((err, i) => (
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

  // Show cached or fresh analysis results
  if (cachedAnalysis) {
    return (
      <div className="container mx-auto px-4 py-12 md:py-16">
        <AnalysisResults data={cachedAnalysis} />
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
