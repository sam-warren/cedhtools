import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About | cedhtools",
  description:
    "About cedhtools: Your data-driven companion for competitive EDH",
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">About cedhtools</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">What is cedhtools?</h2>
        <p className="mb-4">
          cedhtools is an analytics platform designed specifically for
          competitive Commander (cEDH) players in Magic: The Gathering. Our
          application aggregates tournament data from Topdeck.gg, processes it,
          and presents it in an easily digestible format to help you make
          data-driven decisions for deck building and metagame analysis.
        </p>
        <p className="mb-4">
          Whether you&apos;re trying to optimize your existing deck, explore new
          commander options, or stay ahead of the metagame trends, cedhtools
          provides you with the analytics and insights you need to gain a
          competitive edge.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          How to Interpret the Data
        </h2>
        <p className="mb-4">
          Our data is organized around commanders and their associated cards.
          Here&apos;s what the key metrics mean:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>
            <strong>Inclusion %</strong>: The percentage of decks in our
            database that include a specific card for a given commander.
          </li>
          <li>
            <strong>Impact on Win Rate</strong>: The average win rate of a
            specific commander playing a specific card, minus that
            commander&apos;s average win rate overall.
          </li>
          <li>
            <strong>Confidence</strong>: A measure of how reliable the win rate impact data is, based on statistical analysis.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          Understanding Confidence Scores
        </h2>
        <p className="mb-4">
          Our confidence score (0-100) is calculated using three key statistical measures:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>
            <strong>Sample Size (0-40 points)</strong>: Based on power analysis for binary outcomes (win/loss). 
            We use a sigmoid function to smoothly scale the score based on the number of games played with the card.
            A target of 100 games is used as a conservative estimate for statistical significance.
          </li>
          <li>
            <strong>Statistical Significance (0-30 points)</strong>: Uses chi-square test with continuity correction for large samples, 
            and Fisher&apos;s Exact Test for small samples (n &lt; 5 in any cell). The score is based on the p-value:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>p &lt; 0.001: Very strong evidence (30 points)</li>
              <li>p &lt; 0.01: Strong evidence (20 points)</li>
              <li>p &lt; 0.05: Moderate evidence (10 points)</li>
            </ul>
          </li>
          <li>
            <strong>Effect Size (0-30 points)</strong>: Uses Cohen&apos;s h to measure the magnitude of the win rate difference, 
            with 95% confidence intervals. The score considers both the effect size and the precision of the estimate:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>|h| ≥ 0.8: Large effect (30 points)</li>
              <li>|h| ≥ 0.5: Medium effect (20 points)</li>
              <li>|h| ≥ 0.2: Small effect (10 points)</li>
            </ul>
            The score is adjusted based on the width of the confidence interval - wider intervals reduce the score.
          </li>
        </ul>
        <p className="mb-4">
          The final confidence score (0-100) is color-coded:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>
            <strong>Green (≥70%)</strong>: High confidence in the win rate impact, based on large sample size, 
            strong statistical significance, and precise effect size estimates
          </li>
          <li>
            <strong>Yellow (40-69%)</strong>: Moderate confidence, with some uncertainty in one or more components
          </li>
          <li>
            <strong>Red (&lt;40%)</strong>: Low confidence, typically due to small sample size, weak statistical significance, 
            or wide confidence intervals in the effect size
          </li>
        </ul>
        <p className="mb-4">
          This scoring system helps you identify which card recommendations are based on solid statistical evidence 
          versus those that should be taken with more caution. The confidence score is particularly useful for:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>
            <strong>Sample Size Assessment</strong>: Understanding if we have enough games to make reliable conclusions
          </li>
          <li>
            <strong>Statistical Reliability</strong>: Knowing how likely the observed differences are due to chance
          </li>
          <li>
            <strong>Effect Precision</strong>: Understanding how precise our estimate of the card&apos;s impact is
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          Data Interpretation Considerations
        </h2>
        <p className="mb-4">
          When using cedhtools for your analysis, please keep in mind:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-2">
          <li>
            <strong>Sample Size Matters</strong>: Data from commanders or cards
            with fewer appearances in tournaments may be less statistically
            significant. We indicate sample sizes wherever possible, such as the
            number of entries for a specific commander, or the number of decks
            that include a specific card.
          </li>
          <li>
            <strong>Meta Context</strong>: The effectiveness of cards and
            commanders can change dramatically as the metagame evolves. Always
            consider when the data was collected and what the meta looked like
            at that time.
          </li>
          <li>
            <strong>Correlation vs. Causation</strong>: A high win rate for a
            card doesn&apos;t necessarily mean it&apos;s causing those wins.
            Consider the broader context of the deck and its strategy.
          </li>
          <li>
            <strong>Playgroup Variance</strong>: Tournament data reflects a
            competitive environment that may differ from your local
            playgroup&apos;s meta.
          </li>
          <li>
            <strong>Data Freshness</strong>: The cedhtools ETL pipeline updates data
            daily, but there may be a lag between tournament results being
            published and appearing in our database.
          </li>
          <li>
            <strong>Deck Registration Accuracy</strong>: cedhtools data relies on
            accurate deck registration from tournament organizers and
            participants.
          </li>
          <li>
            <strong>Decklist Updates</strong>: Due to how we collect data from
            Moxfield, it is entirely possible that the decklists we collect from
            a tournament are not the same as the decklists that were actually
            played, due to decklist updates by their authors. This means that
            the data we collect may not be 100% accurate.{" "}
            <strong>
              This tool is intended to be used as a guide, not a definitive source.
            </strong>
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Data Sources</h2>
        <p className="mb-4">
          cedhtools currently aggregates data from Topdeck.gg tournaments.
          We&apos;re continuously working to expand our data sources to provide
          an even more comprehensive view of the CEDH landscape.
        </p>
        <p className="mb-4">
          Our ETL (Extract, Transform, Load) pipeline processes this data daily
          to ensure you have access to the most current information available.
        </p>
        <p className="mb-4">
          Data is collected from September 24, 2024 onwards.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">
          Feedback and Suggestions
        </h2>
        <p>
          We&apos;re constantly improving cedhtools based on user feedback. If
          you have suggestions, questions about our data, or need help
          interpreting specific metrics, please reach out through our{" "}
          <Link href="/contact" className="underline">
            contact form
          </Link>{" "}
          or join our community{" "}
          <Link
            href={process.env.NEXT_PUBLIC_DISCORD_URL || ""}
            className="underline"
          >
            Discord
          </Link>
          .
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-semibold mb-4">
          Acknowledgements and Thanks
        </h2>
        <p>
          We would like to thank the following people for their help and support
          in the development of cedhtools:
        </p>
        <ul>
          <li>
            -{" "}
            <Link href="https://topdeck.gg/" className="underline">
              Topdeck.gg
            </Link>{" "}
            for providing the data that powers cedhtools.
          </li>
          <li>
            -{" "}
            <Link href="https://www.moxfield.com/" className="underline">
              Moxfield
            </Link>{" "}
            for providing the platform for collecting and sharing decklists.
          </li>
        </ul>
      </section>
    </div>
  );
}
