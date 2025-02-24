"use client";

import { BarChartComponent } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TournamentDetails } from "@/services/tournaments";
import Link from "next/link";

interface Props {
  tournamentDetails: TournamentDetails;
}

export default function TournamentDetailsPage({ tournamentDetails }: Props) {
  const standingsColumns = [
    {
      accessorKey: "rank",
      header: "Rank"
    },
    {
      accessorKey: "player",
      header: "Player",
      cell: ({ row }: { row: { getValue: (key: string) => string } }) => (
        <Link
          href={`/players/${row.getValue("player").toLowerCase().replace(/\s+/g, "-")}`}
          className="text-foreground hover:underline">
          {row.getValue("player")}
        </Link>
      )
    },
    {
      accessorKey: "commander",
      header: "Commander",
      cell: ({ row }: { row: { getValue: (key: string) => string } }) => (
        <Link
          href={`/commanders/${row.getValue("commander").toLowerCase().replace(/\s+/g, "-")}`}
          className="text-foreground hover:underline">
          {row.getValue("commander")}
        </Link>
      )
    },
    {
      accessorKey: "wins",
      header: "Wins"
    },
    {
      accessorKey: "losses",
      header: "Losses"
    },
    {
      accessorKey: "draws",
      header: "Draws"
    },
    {
      accessorKey: "points",
      header: "Points"
    }
  ];

  // Format date in UTC to ensure consistency
  const date = new Date(tournamentDetails.date);
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC"
  }).format(date);

  return (
    <div className="space-y-6">
      <PageHeader
        title={tournamentDetails.name}
        description={`${formattedDate} • ${tournamentDetails.players} players • ${tournamentDetails.swissRounds} swiss rounds • Top ${tournamentDetails.topCut}`}
      />

      <Tabs defaultValue="stats" className="space-y-6">
        <div className="flex justify-center">
          <TabsList>
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="rounds">Rounds</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <DonutChart
              data={tournamentDetails.commanderStats}
              title="Commander Meta Share"
              description="Distribution of commanders in the tournament"
              valueKey="count"
              centerLabel="Commanders"
              footerMessage="Very diverse meta"
              footerDescription="A wide variety of commanders were played, with no one commander dominating the meta."
            />
            <BarChartComponent
              data={tournamentDetails.roundStats}
              title="Draw Rate by Round"
              description="Percentage of games that ended in a draw during each round of swiss"
              tooltipLabel="Draw Rate"
              dataKey="drawRate"
              xAxisKey="round"
              footerMessage="Draw rates tend to increase in later rounds"
              footerDescription="This might indicate more competitive matches"
            />
          </div>

          <Card className="shadow-sm transition-shadow duration-200 hover:shadow-md">
            <CardHeader>
              <CardTitle>Final Standings</CardTitle>
              <CardDescription>Tournament results and player performance</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable columns={standingsColumns} data={tournamentDetails.standings} enableRowSelection={false} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rounds" className="space-y-6">
          {/* Rounds content will be added later */}
          <Card>
            <CardHeader>
              <CardTitle>Round Details</CardTitle>
              <CardDescription>Match results and pairings for each round</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground">Round details coming soon...</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
