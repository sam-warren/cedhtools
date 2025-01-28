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

export default async function CommanderCardPage({
  params,
}: {
  params: { commanderIds: string; cardId: string };
}) {
  const commanderIds = params.commanderIds.split(",").sort();
  const cardId = params.cardId;

  // Mock data structure
  const cardData = {
    name: "Dockside Extortionist",
    type: "Creature",
    manaCost: "{1}{R}",
    commanderName: "Rograkh, Son of Rogahh + Silas Renn, Seeker Adept",
    winRate: 67.2,
    drawRate: 12.4,
    synergy: 0.85,
    inclusion: 85.4,
    playRate: 92.3,
    totalGames: 1250,
    winRateOverTime: [
      { date: "2024-01-01", winRate: "65" },
      { date: "2024-01-08", winRate: "66" },
      { date: "2024-01-15", winRate: "68" },
      { date: "2024-01-22", winRate: "67" },
      { date: "2024-01-29", winRate: "69" },
    ],
    playRateOverTime: [
      { date: "2024-01-01", playRate: "90" },
      { date: "2024-01-08", playRate: "91" },
      { date: "2024-01-15", playRate: "92" },
      { date: "2024-01-22", playRate: "93" },
      { date: "2024-01-29", playRate: "92" },
    ],
  };

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/commander/${params.commanderIds}`}>
                {cardData.commanderName}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{cardData.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <DatePickerWithPresets />
      </div>

      {/* Card Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{cardData.name}</h1>
          <p className="text-sm text-muted-foreground">
            {cardData.type} • {cardData.manaCost}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Win Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{cardData.winRate}%</div>
            <p className="text-xs text-muted-foreground">When drawn in games</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Synergy Score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{cardData.synergy}</div>
            <p className="text-xs text-muted-foreground">
              Strong synergy with commander
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Inclusion Rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{cardData.inclusion}%</div>
            <p className="text-xs text-muted-foreground">
              Of decks include this card
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sample Size</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{cardData.totalGames}</div>
            <p className="text-xs text-muted-foreground">
              Games played with this card
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <WinRateChart data={cardData.winRateOverTime} name={cardData.name} />
        <PopularityChart
          data={cardData.playRateOverTime}
          name={cardData.name}
        />
      </div>
    </div>
  );
}
