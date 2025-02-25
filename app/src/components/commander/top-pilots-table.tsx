"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { NoData } from "@/components/ui/no-data";
import type { TopPilot } from "@/types/api/commanders";
import Link from "next/link";

interface TopPilotsTableProps {
  data?: TopPilot[];
}

const columns = [
  {
    accessorKey: "name",
    header: "Player",
    cell: ({ row }: { row: { getValue: (key: string) => string; original: TopPilot } }) => (
      <Link
        href={`/players/${row.original.id}`}
        className="text-foreground hover:underline">
        {row.getValue("name")}
      </Link>
    )
  },
  {
    accessorKey: "games",
    header: "Games"
  },
  {
    accessorKey: "wins",
    header: "Wins"
  },
  {
    accessorKey: "winRate",
    header: "Win Rate",
    cell: ({ row }: { row: { getValue: (key: string) => number } }) => `${row.getValue("winRate").toFixed(1)}%`
  },
  {
    accessorKey: "top4s",
    header: "Top 4s"
  }
];

export function TopPilotsTable({ data = [] }: TopPilotsTableProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="shadow-sm transition-shadow duration-200 hover:shadow-md">
        <CardHeader>
          <CardTitle>Top Pilots</CardTitle>
          <CardDescription>Most successful players with this commander</CardDescription>
        </CardHeader>
        <CardContent>
          <NoData 
            message="No pilot data available" 
            suggestion="Check back later for tournament results" 
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm transition-shadow duration-200 hover:shadow-md">
      <CardHeader>
        <CardTitle>Top Pilots</CardTitle>
        <CardDescription>Most successful players with this commander</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={data} enableRowSelection={false} enableViewOptions={false} />
      </CardContent>
    </Card>
  );
}
