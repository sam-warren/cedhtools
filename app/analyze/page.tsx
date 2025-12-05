import { Metadata } from "next";
import { DeckAnalyzer } from "./deck-analyzer";

export const metadata: Metadata = {
  title: "Analyze Deck",
  description:
    "Analyze your cEDH deck against tournament data. Get personalized card recommendations and see how your deck compares to winning lists.",
};

export default function AnalyzePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Deck Analysis</h1>
          <p className="text-muted-foreground">
            Paste your decklist or Moxfield URL to get personalized
            recommendations based on tournament data. We&apos;ll analyze which
            cards correlate with winning and suggest improvements.
          </p>
        </div>

        <DeckAnalyzer />
      </div>
    </div>
  );
}


