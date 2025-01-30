"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { DatePickerWithPresets } from "@/components/ui/date-picker";
import { columns, Commander } from "@/src/lib/components/commanders/commander-columns";
import { PageHeader } from "@/src/lib/layout/page-header";
import { useFilterStore } from "@/src/stores/filter-store";

export default function CommandersPage() {
  const commanders: Commander[] = [
    {
      id: "1",
      name: "Rograkh, Son of Rogahh + Silas Renn, Seeker Adept",
      winRate: 20.22,
      metaShare: 10.75,
      tournamentWins: 10,
      top4s: 14,
      top16s: 22,
      entries: 513,
      colorIdentity: "{U}{B}{R}",
    },
    {
      id: "2",
      name: "Thrasios, Triton Hero + Tymna the Weaver",
      winRate: 18.75,
      metaShare: 8.92,
      tournamentWins: 8,
      top4s: 12,
      top16s: 18,
      entries: 425,
      colorIdentity: "{W}{U}{B}{G}",
    },
    // Add more mock data as needed
  ];

  const { formattedDateRange } = useFilterStore();

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <PageHeader
        breadcrumbs={[
          { href: "/", label: "Home" },
          { href: "/commanders", label: "Commanders" },
        ]}
      >
        <DatePickerWithPresets />
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Commander Leaderboard</CardTitle>
          <CardDescription>
            Top performing commanders in cEDH tournaments for {formattedDateRange}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={commanders} />
        </CardContent>
      </Card>
    </div>
  );
}
