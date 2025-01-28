import PopularityChart from "@/components/charts/popularity-chart";
import WinRateChart from "@/components/charts/win-rate-chart";
import { DatePickerWithPresets } from "@/components/shared/date-picker";
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
import { SeatWinRateChart } from "@/components/charts/seat-win-rate-chart";
import { Separator } from "@/components/ui/separator";
import { ManaCost } from "@/components/icons/mana-symbol";
import { DataTable } from "@/components/ui/data-table";
import { cardColumns, type DeckCard } from "./card-columns";

export default async function CommanderPage(props: {
  params: Promise<{ commanderIds: string }>;
}) {
  const params = await props.params;
  const commanderIds = params.commanderIds.split(",").sort();
  console.log(commanderIds);
  // Mock data structure
  const commanderData = {
    name: "Rograkh, Son of Rogahh + Silas Renn, Seeker Adept",
    winRate: 20.22,
    drawRate: 8.23,
    totalGames: 2450,
    metaShare: 10.75,
    conversionRate: 12.41,
    seatWinRate: [
      { seat: "1", winRate: 27.2 },
      { seat: "2", winRate: 22.5 },
      { seat: "3", winRate: 17.3 },
      { seat: "4", winRate: 15.2 },
    ],
    cards: [
      {
        name: "Sol Ring",
        type: "Artifact" as const,
        manaCost: "{1}",
        winRate: 62.1,
        winRateDiff: 12.3,
        inclusionRate: 99.4,
      },
      {
        name: "Cyclonic Rift",
        type: "Instant" as const,
        manaCost: "{1}{U}",
        winRate: 59.8,
        winRateDiff: -8.4,
        inclusionRate: 13.4,
      },
      {
        name: "Smothering Tithe",
        type: "Enchantment" as const,
        manaCost: "{3}{W}",
        winRate: 64.3,
        winRateDiff: 0,
        inclusionRate: 2.4,
      },
      {
        name: "Dockside Extortionist",
        type: "Creature" as const,
        manaCost: "{1}{R}",
        winRate: 67.2,
        winRateDiff: 12.3,
        inclusionRate: 75.5,
      },
    ] satisfies DeckCard[],
    winRateOverTime: [
      { date: "2024-01-01", winRate: "22" },
      { date: "2024-01-08", winRate: "24" },
      { date: "2024-01-15", winRate: "26" },
      { date: "2024-01-22", winRate: "25" },
      { date: "2024-01-29", winRate: "23" },
      { date: "2024-02-05", winRate: "27" },
      { date: "2024-02-12", winRate: "24" },
      { date: "2024-02-19", winRate: "26" },
      { date: "2024-02-26", winRate: "25" },
    ],
    popularityOverTime: [
      { date: "2024-01-01", popularity: "4" },
      { date: "2024-01-08", popularity: "5" },
      { date: "2024-01-15", popularity: "6" },
      { date: "2024-01-22", popularity: "3" },
      { date: "2024-01-29", popularity: "2" },
      { date: "2024-02-05", popularity: "9" },
      { date: "2024-02-12", popularity: "10" },
      { date: "2024-02-19", popularity: "8" },
      { date: "2024-02-26", popularity: "6" },
    ],
  };

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      {/* Header Section with Date Picker */}
      <div className="flex items-center justify-between">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {commanderIds.map((id, index) => (
              <BreadcrumbItem key={id}>
                {index === commanderIds.length - 1 ? (
                  <BreadcrumbPage>{commanderData.name}</BreadcrumbPage>
                ) : (
                  <>
                    <BreadcrumbLink href={`/commander/${id}`}>
                      {commanderData.name}
                    </BreadcrumbLink>
                    <BreadcrumbSeparator />
                  </>
                )}
              </BreadcrumbItem>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        <DatePickerWithPresets />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {commanderData.name}
            </h1>
            <p className="text-sm text-muted-foreground d-foreground mt-2">
              {commanderData.totalGames} decks
            </p>
          </div>
        </div>
      </div>
      <Separator />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tournament Wins</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">10</div>
            <p className="text-xs text-muted-foreground mt-1">
              Out of 129 tournaments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Top 4s</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">14</div>
            <p className="text-xs text-muted-foreground mt-1">
              Out of 129 tournaments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Top 16s</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">22</div>
            <p className="text-xs text-muted-foreground mt-1">
              Out of 129 tournaments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tournament Entries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">513</div>
            <p className="text-xs text-muted-foreground mt-1">
              Out of 129 tournaments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Win Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{commanderData.winRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Reliably high-performing deck
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Draw Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{commanderData.drawRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Not prone to drawing games
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Conversion Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {commanderData.conversionRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Regularly makes top cut
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Meta Share</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{commanderData.metaShare}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Very popular in the meta
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="space-y-4">
        <div className="w-full">
          <WinRateChart
            data={commanderData.winRateOverTime}
            name={commanderData.name}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <SeatWinRateChart
              data={commanderData.seatWinRate}
              name={commanderData.name}
            />
          </div>
          <div className="col-span-2">
            <PopularityChart
              data={commanderData.popularityOverTime}
              name={commanderData.name}
            />
          </div>
        </div>
      </div>

      {/* Card Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cards Played</CardTitle>
          <CardDescription>
            All cards played by {commanderData.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable<DeckCard, DeckCard>
            columns={cardColumns}
            data={commanderData.cards}
          />
        </CardContent>
      </Card>
    </div>
  );
}
