import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface AnalyzeCTAProps {
  commanderName: string;
  commanderId: number;
  colorId: string;
}

/**
 * Server Component for the "Analyze your deck" CTA section
 * This is purely static content that can be rendered on the server
 */
export function AnalyzeCTA({ commanderName, commanderId, colorId }: AnalyzeCTAProps) {
  // Build the analyze URL with query params to pre-fill the commander
  const analyzeUrl = `/analyze?commander=${encodeURIComponent(commanderName)}&commanderId=${commanderId}&colorId=${encodeURIComponent(colorId)}`;
  
  return (
    <section className="border-t pt-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">Analyze your {commanderName} deck</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Get personalized card recommendations based on tournament data
          </p>
        </div>
        <Link href={analyzeUrl}>
          <Button>
            Analyze Deck
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </section>
  );
}

