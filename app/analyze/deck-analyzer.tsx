"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

export function DeckAnalyzer() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Deck Analyzer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-8">
            <Clock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              We&apos;re rebuilding the deck analyzer to use our new tournament data pipeline.
              This will provide more accurate recommendations based on real tournament performance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/commanders">
                <Button variant="outline">
                  Browse Commanders
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">
                What&apos;s Coming
              </h3>
              <p className="text-sm text-muted-foreground">
                The new deck analyzer will include win rate analysis, card performance metrics, and personalized recommendations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
