import { Metadata } from "next";
import { DeckAnalyzer } from "./deck-analyzer";

export const metadata: Metadata = {
  title: "Analyze Deck",
  description:
    "Analyze your cEDH deck against tournament data. Get personalized card recommendations and see how your deck compares to winning lists.",
};

export default function AnalyzePage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <DeckAnalyzer />
    </div>
  );
}
