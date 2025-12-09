import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Frequently Asked Questions</h1>
        <p className="text-muted-foreground">
          Understanding the statistics and metrics used on cEDH Tools
        </p>
      </div>

      {/* Conversion Score Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Conversion Score</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="what-is">
              <AccordionTrigger>What is Conversion Score?</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <p>
                  Conversion Score measures how often a commander (or card)
                  reaches top cut compared to what would be expected based on
                  random chance, accounting for tournament sizes.
                </p>
                <p>
                  A score of <strong>100</strong> means exactly as expected.
                  Scores above 100 indicate better-than-expected performance,
                  while scores below 100 indicate worse-than-expected
                  performance.
                </p>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                  Conversion Score = (Actual Top Cuts ÷ Expected Top Cuts) × 100
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="why-not-rate">
              <AccordionTrigger>
                Why not just use Conversion Rate?
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <p>
                  Conversion Rate (top cuts ÷ entries) treats all tournaments
                  equally, but making top cut in a 128-player event is much
                  harder than in a 32-player event.
                </p>
                <p>
                  <strong>Example:</strong> Two commanders both have 50%
                  conversion rate:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    Commander A: 1 top cut in 2 entries, both in 128-player
                    events
                  </li>
                  <li>
                    Commander B: 1 top cut in 2 entries, both in 32-player
                    events
                  </li>
                </ul>
                <p>
                  Commander A&apos;s performance is far more impressive!
                  Conversion Score captures this by giving Commander A a higher
                  score.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="how-calculated">
              <AccordionTrigger>
                How is Expected Top Cuts calculated?
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <p>
                  For each tournament entry, we calculate the probability of
                  making top cut if all players had equal skill:
                </p>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                  Entry Probability = Top Cut Size ÷ Tournament Size
                </div>
                <p>
                  We sum these probabilities across all entries to get Expected
                  Top Cuts.
                </p>
                <p>
                  <strong>Example:</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    Entry in 128-player event (top 16): 16÷128 = 0.125 expected
                  </li>
                  <li>
                    Entry in 64-player event (top 16): 16÷64 = 0.25 expected
                  </li>
                  <li>
                    Entry in 32-player event (top 8): 8÷32 = 0.25 expected
                  </li>
                  <li>
                    <strong>Total Expected: 0.625</strong>
                  </li>
                </ul>
                <p>
                  If this commander got 2 actual top cuts from these 3 entries:
                </p>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                  Conversion Score = (2 ÷ 0.625) × 100 = 320
                </div>
                <p>This commander performed 3.2× better than expected!</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="interpret-score">
              <AccordionTrigger>How do I interpret the score?</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
                    <p className="font-bold text-green-500">&gt; 105</p>
                    <p className="text-sm">Better than expected</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="font-bold">95 - 105</p>
                    <p className="text-sm">About as expected</p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                    <p className="font-bold text-red-500">&lt; 95</p>
                    <p className="text-sm">Worse than expected</p>
                  </div>
                </div>
                <p className="mt-4">
                  Think of it like baseball&apos;s wRC+ or OPS+ statistics. A
                  score of 150 means 50% better than expected; a score of 75
                  means 25% worse than expected.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="card-score">
              <AccordionTrigger>
                What does Conversion Score mean for a card?
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <p>
                  For cards, we calculate the same way but across all decks
                  containing that card:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    Find all tournament entries (decks) that include the card
                  </li>
                  <li>Sum the expected top cut probability for each entry</li>
                  <li>Compare actual top cuts to expected</li>
                </ul>
                <p>
                  <strong>Example:</strong> If Rhystic Study appears in 200
                  decks with a collective expected top cuts of 40, and those
                  decks actually got 52 top cuts:
                </p>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                  Conversion Score = (52 ÷ 40) × 100 = 130
                </div>
                <p>
                  This tells you:{" "}
                  <em>
                    &quot;Decks running Rhystic Study convert to top cut 30%
                    more often than expected given the tournaments they
                    attended.&quot;
                  </em>
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sample-size">
              <AccordionTrigger>
                What about sample size / statistical significance?
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <p>
                  Conversion Score addresses the tournament-size bias, but
                  doesn&apos;t address sample size. A commander with 3 entries
                  and 2 top cuts might show a very high score due to luck.
                </p>
                <p>
                  <strong>Guidelines:</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>
                    <strong>&lt; 20 entries:</strong> Take with a grain of salt
                  </li>
                  <li>
                    <strong>20-50 entries:</strong> Directionally useful
                  </li>
                  <li>
                    <strong>&gt; 50 entries:</strong> More statistically
                    reliable
                  </li>
                </ul>
                <p>
                  We display entry counts alongside scores to help you assess
                  reliability.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Other Metrics Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Other Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="win-rate">
              <AccordionTrigger>What is Win Rate?</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <p>
                  Win Rate is the percentage of games won out of total games
                  played (wins + losses + draws).
                </p>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                  Win Rate = Wins ÷ (Wins + Losses + Draws)
                </div>
                <p>
                  In a 4-player pod, the expected win rate is 25%. Commanders or
                  cards with win rates significantly above 25% are performing
                  well.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="play-rate">
              <AccordionTrigger>What is Play Rate?</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <p>
                  Play Rate shows what percentage of decks (for a given
                  commander) include a specific card.
                </p>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                  Play Rate = Decks with Card ÷ Total Decks with Decklists
                </div>
                <p>
                  A play rate of 95% means nearly all decks of that commander
                  include the card.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="meta-share">
              <AccordionTrigger>What is Meta Share?</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <p>
                  Meta Share shows what percentage of all tournament entries are
                  playing a specific commander.
                </p>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                  Meta Share = Commander Entries ÷ Total Entries
                </div>
                <p>
                  A meta share of 5% means 1 in 20 tournament players are on
                  that commander.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Data Sources Section */}
      <Card>
        <CardHeader>
          <CardTitle>Data Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="where-data">
              <AccordionTrigger>
                Where does the data come from?
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <p>
                  Tournament data is sourced from{" "}
                  <a
                    href="https://topdeck.gg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    TopDeck.gg
                  </a>
                  , which hosts tournament results for competitive EDH events.
                </p>
                <p>
                  We include tournaments from June 1 2025 onwards to ensure data
                  quality and relevance to the current meta.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="update-frequency">
              <AccordionTrigger>How often is data updated?</AccordionTrigger>
              <AccordionContent>
                <p>
                  Data is synced nightly from TopDeck.gg. Tournament results
                  are available the day after the event.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="decklist-validation">
              <AccordionTrigger>How are decklists validated?</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <p>
                  Decklists are validated to ensure they&apos;re legal commander
                  decks:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Exactly 100 cards (including commander)</li>
                  <li>Valid commander(s) in the command zone</li>
                  <li>Cards match the commander&apos;s color identity</li>
                </ul>
                <p>
                  Invalid decklists are excluded from card statistics to ensure
                  data quality.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

