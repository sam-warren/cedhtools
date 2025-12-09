import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RecentDecks } from "@/components/shared/recent-decks";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      {/* Hero */}
      <section className="max-w-2xl mb-16">
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-6">
          cEDH deck analysis powered by tournament data
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Compare your decklist against thousands of tournament results.
          Identify high-performing cards and potential cuts based on real
          competitive data.
        </p>
        <div className="flex gap-4">
          <Link
            href="/analyze"
            className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Analyze a deck
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/commanders"
            className="inline-flex items-center gap-2 border px-5 py-2.5 text-sm font-medium hover:bg-secondary transition-colors"
          >
            Browse commanders
          </Link>
        </div>
      </section>

      {/* Recent Decks - Jump Back In */}
      <section className="mb-12">
        <RecentDecks />
      </section>

      {/* Features */}
      <section className="grid md:grid-cols-3 gap-8 mb-16">
        <Feature
          title="Commander Statistics"
          description="Conversion rates, win rates, and seat position analysis for every competitive commander."
          href="/commanders"
        />
        <Feature
          title="Card Performance"
          description="Track play rates and win rates for cards within specific commanders."
          href="/commanders"
        />
        <Feature
          title="Temporal Trends"
          description="See how commanders and cards perform over time with weekly statistics."
          href="/commanders"
        />
      </section>

      {/* Data Source */}
      <section className="border-t pt-8">
        <p className="text-sm text-muted-foreground">
          Data sourced from{" "}
          <a
            href="https://topdeck.gg"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            TopDeck.gg
          </a>
          {" "}tournament results. Card images provided by Scryfall.
        </p>
      </section>
    </div>
  );
}

function Feature({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href} className="group block">
      <h3 className="font-medium mb-2 group-hover:underline">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Link>
  );
}
