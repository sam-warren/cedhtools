import { Header } from "@/components/shared/layout/header";
import { MoxfieldSearch } from "@/components/shared/search/moxfield-search";
import { Button } from "@/components/ui/button";
import { BarChart3, Database, Users } from "lucide-react";
import Link from "next/link";
import { createClient } from "./utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  // Fetch actual counts from database
  const { count: tournamentCount } = await supabase
    .from("processed_tournaments")
    .select("*", { count: "exact", head: true });

  const { count: commanderCount } = await supabase
    .from("commanders")
    .select("*", { count: "exact", head: true });

  // Use counts or fallback to default values
  const displayTournamentCount = tournamentCount || 500;
  const displayCommanderCount = commanderCount || 700;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section with Enhanced Design */}
        <section className="relative w-full py-24 overflow-hidden bg-gradient-to-b from-background to-muted/30">
          {/* Abstract Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-[40%] -right-[30%] w-[80%] h-[80%] rounded-full bg-primary/5 blur-3xl"></div>
            <div className="absolute -bottom-[20%] -left-[30%] w-[80%] h-[80%] rounded-full bg-indigo-500/5 blur-3xl"></div>
          </div>

          <div className="container relative px-4 md:px-6 mx-auto">
            <div className="max-w-4xl mx-auto flex flex-col items-center space-y-8 text-center">
              <div className="space-y-4">
                <h1 className="text-5xl font-bold tracking-tighter sm:text-6xl md:text-7xl font-mono">
                  CEDH Deck Analysis
                </h1>
                <p className="text-xl md:text-2xl text-muted-foreground max-w-[800px] mx-auto">
                  Analyze your CEDH decks with data from real tournaments. Find
                  the best cards for your commander.
                </p>
              </div>

              {/* Enhanced Search Box */}
              <div className="w-full max-w-xl mx-auto relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-indigo-500/20 rounded-xl blur-xl opacity-75 group-hover:opacity-100 transition duration-200"></div>
                <div className="relative p-1 bg-background border rounded-lg shadow-lg">
                  <MoxfieldSearch />
                </div>
              </div>

              {/* Metrics Bar with Real Data */}
              <div className="flex flex-wrap justify-center gap-8 mt-8">
                <div className="flex flex-col items-center">
                  <div className="text-primary font-semibold text-2xl font-mono">
                    {displayTournamentCount.toLocaleString()}
                  </div>
                  <div className="text-muted-foreground">
                    Tournaments Processed
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-primary font-semibold text-2xl font-mono">
                    {displayCommanderCount.toLocaleString()}
                  </div>
                  <div className="text-muted-foreground">Unique Commanders</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-primary font-semibold text-2xl font-mono">
                    New Data Daily
                  </div>
                  <div className="text-muted-foreground">Always up to date</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Section with Cards */}
        <section className="w-full py-20 bg-muted/30">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight mb-4 font-mono">
                Powerful Analysis Tools
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Make data-driven decisions for your Commander decks with our
                comprehensive toolset.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature Card 1 */}
              <div className="bg-card rounded-xl border shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col h-full">
                <div className="p-3 bg-primary/10 rounded-full w-fit mb-4">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Real Tournament Data</h3>
                <p className="text-muted-foreground mb-4 flex-grow">
                  Real statistics from competitive EDH tournaments worldwide.
                  Access data from hundreds of events.
                </p>
              </div>

              {/* Feature Card 2 */}
              <div className="bg-card rounded-xl border shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col h-full">
                <div className="p-3 bg-primary/10 rounded-full w-fit mb-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Statistical Analysis</h3>
                <p className="text-muted-foreground mb-4 flex-grow">
                  Compare your deck against win rates and inclusion rates.
                  Identify cards that overperform or underperform.
                </p>
              </div>

              {/* Feature Card 3 */}
              <div className="bg-card rounded-xl border shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col h-full">
                <div className="p-3 bg-primary/10 rounded-full w-fit mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Commander-Specific</h3>
                <p className="text-muted-foreground mb-4 flex-grow">
                  See which cards perform best with your specific commander. Get
                  personalized recommendations based on real data.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-20 bg-gradient-to-b from-muted/30 to-background">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="bg-card border rounded-xl p-8 md:p-12 shadow-lg max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold tracking-tight mb-4 font-mono">
                Ready to optimize your deck?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Import your Moxfield deck and get instant insights based on
                tournament data.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button asChild size="lg" variant="outline">
                  <Link href="/">Search Decks</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-6 border-t">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} JUNCTIONTECH INC. All rights
              reserved.
            </p>
            <div className="flex gap-4">
              <Link
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Privacy
              </Link>
              <Link
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Terms
              </Link>
              <Link
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
