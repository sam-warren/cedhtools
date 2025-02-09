import { columns, type Commander } from "@/components/tables/commander-columns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";

export default function CommandersPage() {
  // const commanders: Commander[] = [
  //   {
  //     id: "1",
  //     name: "Rograkh, Son of Rogahh + Silas Renn, Seeker Adept",
  //     winRate: 20.22,
  //     metaShare: 10.75,
  //     tournamentWins: 10,
  //     top4s: 14,
  //     top16s: 22,
  //     entries: 513,
  //     colorIdentity: "{U}{B}{R}"
  //   },
  //   {
  //     id: "2",
  //     name: "Thrasios, Triton Hero + Tymna the Weaver",
  //     winRate: 18.75,
  //     metaShare: 8.92,
  //     tournamentWins: 8,
  //     top4s: 12,
  //     top16s: 18,
  //     entries: 425,
  //     colorIdentity: "{W}{U}{B}{G}"
  //   }
  //   // Add more mock data as needed.
  // ];

  return (
    <h1>Commanders</h1>
    // <Card>
    //   <CardHeader>
    //     <CardTitle>Commander Leaderboard</CardTitle>
    //     <CardDescription>Top performing commanders in cEDH tournaments for (date range)</CardDescription>
    //   </CardHeader>
    //   <CardContent>
    //     <DataTable columns={columns} data={commanders} />
    //   </CardContent>
    // </Card>
  );
}
