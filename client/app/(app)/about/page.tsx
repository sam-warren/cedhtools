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
          cedhtools is a comprehensive analytics platform designed specifically
          for competitive Commander (cEDH) players in Magic: The Gathering. Our
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
            specific commander playing a specific card, minus that commander&apos;s
            average win rate overall.
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
            competitive environment that may differ from your local playgroup&apos;s
            meta.
          </li>
          <li>
            <strong>Data Freshness</strong>: Our ETL pipeline updates data
            daily, but there may be a lag between tournament results being
            published and appearing in our database.
          </li>
          <li>
            <strong>Deck Registration Accuracy</strong>: Our data relies on
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
              It is intended to be used as a guide, not a definitive source.
            </strong>
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Data Sources</h2>
        <p className="mb-4">
          cedhtools currently aggregates data from Topdeck.gg tournaments. We&apos;re
          continuously working to expand our data sources to provide an even
          more comprehensive view of the CEDH landscape.
        </p>
        <p className="mb-4">
          Our ETL (Extract, Transform, Load) pipeline processes this data daily
          to ensure you have access to the most current information available.
        </p>
      </section>

      <section>
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
    </div>
  );
}
