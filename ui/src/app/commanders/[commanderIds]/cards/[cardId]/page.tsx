import PopularityChart from "@/components/charts/popularity-chart";
import WinRateChart from "@/components/charts/win-rate-chart";
import { ManaCost } from "@/components/icons/mana-symbol";
import { DatePickerWithPresets } from "@/components/ui/date-picker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { ChevronUp, ChevronDown, ChevronsUpDown, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DiffBadge } from "@/components/badges/diff-badge";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { InclusionRateBadge } from "@/components/badges/inclusion-rate-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export default async function CommanderCardPage(props: {
  params: Promise<{ commanderIds: string; cardId: string }>;
}) {
  const params = await props.params;
  const commanderIds = params.commanderIds.split(",").sort();
  const cardId = params.cardId;

  // Mock data structure
  const cardData = {
    name: "Dockside Extortionist",
    type: "Creature - Goblin Pirate ",
    manaCost: "{1}{R}",
    commanderName: "Rograkh, Son of Rogahh + Silas Renn, Seeker Adept",
    winRate: 30.2,
    winRateDiff: 3,
    drawRate: 10.6,
    drawRateDiff: -2,
    inclusion: 99.8,
    decksWithCard: 998,
    totalDecks: 1000,
    synergyScore: 24.2,
    winRateOverTime: [
      { date: "2024-01-01", wi3nRate: "65" },
      { date: "2024-01-08", winRate: "66" },
      { date: "2024-01-15", winRate: "68" },
      { date: "2024-01-22", winRate: "67" },
      { date: "2024-01-29", winRate: "69" },
    ],
    popularityOverTime: [
      { date: "2024-01-01", popularity: "90" },
      { date: "2024-01-08", popularity: "91" },
      { date: "2024-01-15", popularity: "92" },
      { date: "2024-01-22", popularity: "93" },
      { date: "2024-01-29", popularity: "0" },
    ],
  };

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <PageHeader
        breadcrumbs={[
          { href: "/", label: "Home" },
          {
            href: `/commanders/${commanderIds}`,
            label: cardData.commanderName,
          },
          {
            href: `/commanders/${commanderIds}/cards/${cardId}`,
            label: cardData.name,
          },
        ]}
      >
        <DatePickerWithPresets />
      </PageHeader>

      {/* Card Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{cardData.name}</h1>
          <div className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
            {cardData.type} • <ManaCost cost={cardData.manaCost} size={14} />
          </div>
        </div>
      </div>
      <Separator />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardDescription>Win Rate</CardDescription>
                <InfoTooltip
                  content={`The average win rate of **${cardData.commanderName}** decks that include **${cardData.name}**. The badge shows how much better or worse this is compared to the average win rate of all **${cardData.commanderName}** decks.`}
                />
              </div>
              <DiffBadge diff={cardData.winRateDiff} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{cardData.winRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {cardData.winRateDiff === 0
                ? "Decks including this card perform the same as average"
                : `Decks including this card tend to perform ${
                    cardData.winRateDiff > 0 ? "better" : "worse"
                  } than average by ${Math.abs(cardData.winRateDiff)}%`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardDescription>Draw Rate</CardDescription>
                <InfoTooltip
                  content={`The average draw rate of **${cardData.commanderName}** decks that include **${cardData.name}**. The badge shows how much better or worse this is compared to the average draw rate of all **${cardData.commanderName}** decks.`}
                />
              </div>
              <DiffBadge diff={cardData.drawRateDiff} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{cardData.drawRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {cardData.drawRateDiff === 0
                ? "Decks including this card draw the same number of games as average"
                : `Decks including this card tend to draw ${
                    cardData.drawRateDiff > 0 ? "more" : "fewer"
                  } games than average by ${Math.abs(cardData.drawRateDiff)}%`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardDescription>Inclusion Rate</CardDescription>
                <InfoTooltip
                  content={`The percentage of **${cardData.commanderName}** decks that include **${cardData.name}**. A higher percentage indicates the card is considered a staple for **${cardData.commanderName}** decks.`}
                />
              </div>
              <InclusionRateBadge rate={cardData.inclusion} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{cardData.inclusion}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {cardData.decksWithCard} of {cardData.totalDecks} decks include
              this card
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardDescription>Synergy Score</CardDescription>
                <InfoTooltip
                  content={`Calculated similar to the EDHRec Synergy Score, this score is equal to the percentage of **${cardData.commanderName}** decks that include this card, minus the percentage of decks that play this card in their color identity.`}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{cardData.synergyScore}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              This card has high synergy with {cardData.commanderName}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <WinRateChart data={cardData.winRateOverTime} name={cardData.name} />
        <PopularityChart
          data={cardData.popularityOverTime}
          name={cardData.name}
        />
      </div>
    </div>
  );
}
