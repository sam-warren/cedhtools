"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * Legacy Deck Page
 * 
 * This page previously supported Moxfield URL-based deck analysis.
 * We've migrated to a new text-based deck analysis flow that:
 * - Doesn't depend on external APIs (Moxfield)
 * - Uses commander dropdown + text deck list input
 * - Resolves cards via Scryfall API
 */
export default function LegacyDeckPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">URL-based Analysis Deprecated</span>
          </div>
          <CardTitle>We&apos;ve Updated Our Deck Analysis</CardTitle>
          <CardDescription>
            We no longer support URL-based deck imports. Our new system is faster
            and more reliable.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <p className="font-medium">New Features:</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Select your commander from our database</li>
              <li>Paste your deck list as text</li>
              <li>No external API dependencies</li>
              <li>Faster analysis</li>
            </ul>
          </div>

          <Button 
            onClick={() => router.push('/')} 
            className="w-full"
          >
            Go to New Deck Analysis
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
