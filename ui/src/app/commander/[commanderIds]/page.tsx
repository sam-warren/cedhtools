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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

export default async function CommanderPage(props: {
  params: Promise<{ commanderIds: string }>;
}) {
  const params = await props.params;
  const commanderIds = params.commanderIds.split(",").sort();
  console.log(commanderIds);
  // Expanded mock data
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
      { name: "Sol Ring", type: "Artifact", manaCost: "{1}", winRate: 62.1 },
      {
        name: "Cyclonic Rift",
        type: "Instant",
        manaCost: "{1}{U}",
        winRate: 59.8,
      },
      {
        name: "Smothering Tithe",
        type: "Enchantment",
        manaCost: "{3}{W}",
        winRate: 64.3,
      },
      {
        name: "Dockside Extortionist",
        type: "Creature",
        manaCost: "{1}{R}",
        winRate: 67.2,
      },
    ],
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
    <div className="container max-w-7xl mx-auto p-6 space-y-8">
      {/* Header Section with Date Picker */}
      <div className="flex items-center justify-between">
        {/* Breadcrumb */}
        <Breadcrumb className="mt-2">
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
          <h1 className="text-3xl font-bold tracking-tight">
            {commanderData.name}
          </h1>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-muted-foreground">
            {commanderData.totalGames} decks
          </p>
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
            <p className="text-xs text-muted-foreground">
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
            <p className="text-xs text-muted-foreground">
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
            <p className="text-xs text-muted-foreground">
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
            <p className="text-xs text-muted-foreground">
              Out of 129 tournaments
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Win Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{commanderData.winRate}%</div>
            <p className="text-xs text-muted-foreground">
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
            <p className="text-xs text-muted-foreground">
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
            <p className="text-xs text-muted-foreground">
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
            <p className="text-xs text-muted-foreground">
              Very popular in the meta
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <WinRateChart
          data={commanderData.winRateOverTime}
          name={commanderData.name}
        />
        <PopularityChart
          data={commanderData.popularityOverTime}
          name={commanderData.name}
        />
        <SeatWinRateChart
          data={commanderData.seatWinRate}
          name={commanderData.name}
        />
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Card Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Mana Cost</TableHead>
                <TableHead className="text-right">Win Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commanderData.cards.map((card) => (
                <TableRow key={card.name}>
                  <TableCell className="font-medium">{card.name}</TableCell>
                  <TableCell>{card.type}</TableCell>
                  <TableCell>{card.manaCost}</TableCell>
                  <TableCell className="text-right">{card.winRate}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
