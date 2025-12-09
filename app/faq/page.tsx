import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about cEDH Tools statistics, metrics, and deck analysis features.",
};

export default function FAQPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-6">
          Frequently Asked Questions
        </h1>
        <p className="text-lg text-muted-foreground">
          Documentation for statistics, metrics, and analysis features.
        </p>
      </div>

      {/* Conversion Score Section */}
      <section className="mb-12">
        <h2 className="text-xl font-medium mb-4 pb-2 border-b">Conversion Score</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="what-is">
            <AccordionTrigger>Definition</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <p>
                Conversion Score quantifies how frequently a commander or card reaches 
                the top cut relative to statistical expectation, normalized for tournament size.
              </p>
              <p>
                A score of <span className="text-foreground font-medium">100</span> indicates 
                performance matching expectation. Values above 100 indicate outperformance; 
                values below indicate underperformance.
              </p>
              <div className="bg-muted/50 p-4 rounded-lg font-mono text-sm text-foreground">
                Conversion Score = (Actual Top Cuts ÷ Expected Top Cuts) × 100
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="why-not-rate">
            <AccordionTrigger>
              Comparison with Conversion Rate
            </AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <p>
                Conversion Rate (top cuts ÷ entries) treats all tournaments equally. 
                However, reaching top cut in a 128-player event represents a significantly 
                greater achievement than in a 32-player event.
              </p>
              <p>
                <span className="text-foreground font-medium">Example:</span> Two commanders 
                with identical 50% conversion rates:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Commander A: 1 top cut from 2 entries in 128-player events</li>
                <li>Commander B: 1 top cut from 2 entries in 32-player events</li>
              </ul>
              <p>
                Commander A demonstrates superior performance. Conversion Score captures 
                this distinction by weighting results according to tournament difficulty.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="how-calculated">
            <AccordionTrigger>
              Expected Top Cuts Calculation
            </AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <p>
                For each tournament entry, the probability of reaching top cut 
                under equal skill distribution is calculated:
              </p>
              <div className="bg-muted/50 p-4 rounded-lg font-mono text-sm text-foreground">
                Entry Probability = Top Cut Size ÷ Tournament Size
              </div>
              <p>
                These probabilities are summed across all entries to determine Expected Top Cuts.
              </p>
              <p><span className="text-foreground font-medium">Example calculation:</span></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>128-player event (top 16): 16÷128 = 0.125</li>
                <li>64-player event (top 16): 16÷64 = 0.25</li>
                <li>32-player event (top 8): 8÷32 = 0.25</li>
                <li className="text-foreground font-medium">Total Expected: 0.625</li>
              </ul>
              <p>
                With 2 actual top cuts from these 3 entries:
              </p>
              <div className="bg-muted/50 p-4 rounded-lg font-mono text-sm text-foreground">
                Conversion Score = (2 ÷ 0.625) × 100 = 320
              </div>
              <p>This indicates performance 3.2× above expectation.</p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="interpret-score">
            <AccordionTrigger>Score Interpretation</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
                  <p className="font-medium text-green-500">&gt; 105</p>
                  <p className="text-sm">Above expectation</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="font-medium text-foreground">95 – 105</p>
                  <p className="text-sm">Within expectation</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                  <p className="font-medium text-red-500">&lt; 95</p>
                  <p className="text-sm">Below expectation</p>
                </div>
              </div>
              <p className="mt-4">
                The metric functions similarly to baseball&apos;s wRC+ or OPS+ statistics. 
                A score of 150 represents 50% outperformance; 75 represents 25% underperformance.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="sample-size">
            <AccordionTrigger>Sample Size Considerations</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <p>
                Conversion Score normalizes for tournament size but does not account for 
                sample size variance. Limited data may produce unreliable scores.
              </p>
              <p><span className="text-foreground font-medium">Reliability guidelines:</span></p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><span className="text-foreground">&lt; 20 entries:</span> High variance; interpret cautiously</li>
                <li><span className="text-foreground">20–50 entries:</span> Moderate reliability</li>
                <li><span className="text-foreground">&gt; 50 entries:</span> Statistically meaningful</li>
              </ul>
              <p>
                Entry counts are displayed alongside all statistics to facilitate 
                reliability assessment.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Win Rate and Delta Section */}
      <section className="mb-12">
        <h2 className="text-xl font-medium mb-4 pb-2 border-b">Win Rate &amp; Delta Values</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="win-rate">
            <AccordionTrigger>Win Rate</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <p>
                Win Rate represents the percentage of games won relative to total 
                games played (wins + losses + draws).
              </p>
              <div className="bg-muted/50 p-4 rounded-lg font-mono text-sm text-foreground">
                Win Rate = Wins ÷ (Wins + Losses + Draws)
              </div>
              <p>
                In 4-player pods, the baseline expected win rate is 25%. Commanders 
                or cards with win rates meaningfully above this threshold demonstrate 
                competitive advantage.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="delta-values">
            <AccordionTrigger>Delta Values</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <p>
                Delta (Δ) values measure performance relative to a baseline, typically 
                the commander&apos;s average for that statistic.
              </p>
              <p><span className="text-foreground font-medium">Win Rate Delta:</span></p>
              <div className="bg-muted/50 p-4 rounded-lg font-mono text-sm text-foreground mb-4">
                Win Rate Δ = Card Win Rate − Commander Average Win Rate
              </div>
              <p>
                A card with +2.5% win rate delta indicates that decks containing 
                this card win 2.5 percentage points more frequently than the 
                commander&apos;s baseline.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg">
                  <p className="font-medium text-green-500">Positive Delta</p>
                  <p className="text-sm">Above commander average</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                  <p className="font-medium text-red-500">Negative Delta</p>
                  <p className="text-sm">Below commander average</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="play-rate">
            <AccordionTrigger>Play Rate</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <p>
                Play Rate indicates the percentage of decks for a given commander 
                that include a specific card.
              </p>
              <div className="bg-muted/50 p-4 rounded-lg font-mono text-sm text-foreground">
                Play Rate = Decks with Card ÷ Total Decks with Decklists
              </div>
              <p>
                A 95% play rate indicates near-universal inclusion among that 
                commander&apos;s pilots—typically a staple card.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="meta-share">
            <AccordionTrigger>Meta Share</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <p>
                Meta Share represents the proportion of total tournament entries 
                piloting a specific commander.
              </p>
              <div className="bg-muted/50 p-4 rounded-lg font-mono text-sm text-foreground">
                Meta Share = Commander Entries ÷ Total Entries
              </div>
              <p>
                A 5% meta share indicates approximately 1 in 20 tournament 
                participants selected that commander.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Deck Analysis Section */}
      <section className="mb-12">
        <h2 className="text-xl font-medium mb-4 pb-2 border-b">Deck Analysis</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="deck-rating">
            <AccordionTrigger>Deck Rating Calculation</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <p>
                Deck Rating provides a composite assessment of card selection quality 
                based on tournament performance data.
              </p>
              <div className="bg-muted/50 p-4 rounded-lg font-mono text-sm text-foreground">
                Score = (Avg Win Rate Δ × 100 × 0.6) + (Avg Conversion Δ × 0.4)
              </div>
              <p>The weighting emphasizes win rate (60%) over conversion performance (40%).</p>
              <div className="space-y-2 mt-4">
                <div className="flex justify-between items-center py-1 border-b border-muted">
                  <span className="text-green-500 font-medium">Optimized</span>
                  <span className="text-sm">Score &gt; 2</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-muted">
                  <span className="text-green-400 font-medium">Strong</span>
                  <span className="text-sm">Score 0.5 – 2</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-muted">
                  <span className="font-medium text-foreground">Average</span>
                  <span className="text-sm">Score −0.5 – 0.5</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-muted">
                  <span className="text-orange-400 font-medium">Suboptimal</span>
                  <span className="text-sm">Score −2 – −0.5</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-red-500 font-medium">Needs Work</span>
                  <span className="text-sm">Score &lt; −2</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="quick-insights">
            <AccordionTrigger>Quick Insights Categories</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <p>
                Quick Insights highlight notable patterns in deck composition 
                based on tournament statistics.
              </p>
              
              <div className="space-y-4 mt-4">
                <div>
                  <p className="text-foreground font-medium">High Performers</p>
                  <p className="text-sm">
                    Cards in the deck with &gt;50% play rate and positive win rate delta (&gt;+1%). 
                    These are well-established cards that consistently contribute to wins.
                  </p>
                </div>
                
                <div>
                  <p className="text-foreground font-medium">Hidden Gems</p>
                  <p className="text-sm">
                    Cards with lower play rate (10–40%) but positive win rate delta (&gt;+1%). 
                    Underutilized options that outperform expectations.
                  </p>
                </div>
                
                <div>
                  <p className="text-foreground font-medium">Consider Cutting</p>
                  <p className="text-sm">
                    Cards with &lt;25% play rate and negative win rate delta. 
                    Underperforming inclusions that may warrant replacement.
                  </p>
                </div>
                
                <div>
                  <p className="text-foreground font-medium">Popular Cards Missing</p>
                  <p className="text-sm">
                    Cards not in the deck with &gt;50% play rate among the commander&apos;s 
                    pilots. Commonly included options absent from the list.
                  </p>
                </div>
              </div>
              
              <p className="text-sm mt-4">
                Note: Categories may not appear if no cards meet the criteria. A highly 
                standard list may show few insights; a unique build may trigger multiple categories.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="unknown-cards">
            <AccordionTrigger>Unknown Cards</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <p>
                Cards listed as &quot;unknown&quot; have insufficient tournament data 
                for statistical analysis. This typically indicates:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Recently released cards not yet appearing in tournament results</li>
                <li>Extremely low play rate cards with minimal data points</li>
                <li>Cards not previously seen with this commander</li>
              </ul>
              <p>
                Unknown status does not imply the card is poor—only that data is unavailable 
                for performance assessment.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Time Periods Section */}
      <section className="mb-12">
        <h2 className="text-xl font-medium mb-4 pb-2 border-b">Time Period Filtering</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="time-periods">
            <AccordionTrigger>Available Time Periods</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <p>Statistics can be filtered by the following time windows:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><span className="text-foreground">Past Month:</span> Last 30 days of tournament data</li>
                <li><span className="text-foreground">Past 3 Months:</span> Last 90 days</li>
                <li><span className="text-foreground">Past 6 Months:</span> Last 180 days (default)</li>
                <li><span className="text-foreground">Past Year:</span> Last 365 days</li>
                <li><span className="text-foreground">All Time:</span> Complete dataset from June 2025 onwards</li>
              </ul>
              <p>
                Shorter periods reflect current meta trends; longer periods provide 
                more stable statistics with larger sample sizes.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="data-start">
            <AccordionTrigger>Data Collection Start Date</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <p>
                Tournament data collection begins June 1, 2025. This cutoff ensures 
                data quality and relevance to the current competitive environment.
              </p>
              <p>
                Historical data prior to this date is excluded to preserve data integrity.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Data Sources Section */}
      <section className="mb-12">
        <h2 className="text-xl font-medium mb-4 pb-2 border-b">Data Sources</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="where-data">
            <AccordionTrigger>Data Origin</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <p>
                All tournament data is sourced from{" "}
                <a
                  href="https://topdeck.gg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline hover:text-primary"
                >
                  TopDeck.gg
                </a>
                , the primary platform for competitive EDH tournament organization and results.
              </p>
              <p>
                The dataset includes tournaments meeting minimum size thresholds 
                to ensure competitive integrity of the statistics.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="update-frequency">
            <AccordionTrigger>Update Schedule</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <p>
                Data synchronization occurs nightly. Tournament results are 
                typically available within 24 hours of event completion.
              </p>
              <p>
                Statistics are recalculated during each synchronization cycle 
                to incorporate new results.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="decklist-validation">
            <AccordionTrigger>Decklist Validation</AccordionTrigger>
            <AccordionContent className="space-y-4 text-muted-foreground">
              <p>
                Submitted decklists undergo validation for Commander format legality:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Exactly 100 cards including commander(s)</li>
                <li>Valid commander designation in command zone</li>
                <li>All cards within commander color identity</li>
                <li>No banned cards</li>
              </ul>
              <p>
                Invalid decklists are excluded from card-level statistics to 
                maintain data integrity. Commander-level statistics (wins, entries) 
                remain unaffected.
              </p>
              <p>
                For more information, visit <a href="https://scrollrack.topdeck.gg" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">scrollrack.topdeck.gg</a>.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Contact Section */}
      <section className="border-t pt-8">
        <p className="text-sm text-muted-foreground">
          Got questions or feedback? Check out our{" "}
          <a
            href="https://discord.gg/4SkzGx9x4Y"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Discord server
          </a>
          .
        </p>
      </section>
    </div>
  );
}
