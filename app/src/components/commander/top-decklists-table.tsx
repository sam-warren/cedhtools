"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { NoData } from "@/components/ui/no-data";
import type { TopDecklist } from "@/types/api/commanders";
import Link from "next/link";

interface TopDecklistsTableProps {
  data?: TopDecklist[];
}

const columns = [
  {
    accessorKey: "name",
    header: "Decklist",
    cell: ({ row }: { row: { getValue: (key: string) => string; original: TopDecklist } }) => (
      <Link
        href={`/decklists/${row.original.id}`}
        className="text-foreground hover:underline">
        {row.getValue("name")}
      </Link>
    )
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
    accessorKey: "tournament",
    header: "Tournament",
    cell: ({ row }: { row: { getValue: (key: string) => string } }) => (
      <Link
        href={`/tournaments/${row.getValue("tournament").toLowerCase().replace(/\s+/g, "-")}`}
        className="text-foreground hover:underline">
        {row.getValue("tournament")}
      </Link>
    )
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }: { row: { getValue: (key: string) => string } }) => {
      const date = new Date(row.getValue("date"));
      return date.toLocaleDateString();
    }
  },
  {
    accessorKey: "standing",
    header: "Standing"
  },
  {
    accessorKey: "winRate",
    header: "Win Rate",
    cell: ({ row }: { row: { getValue: (key: string) => number } }) => `${row.getValue("winRate").toFixed(1)}%`
  }
];

export function TopDecklistsTable({ data = [] }: TopDecklistsTableProps) {
  console.log("TopDecklistsTable data:", data);

  if (!data || data.length === 0) {
    return (
      <Card className="shadow-sm transition-shadow duration-200 hover:shadow-md">
        <CardHeader>
          <CardTitle>Recent Top-Performing Decklists</CardTitle>
          <CardDescription>Most successful decklists in recent tournaments</CardDescription>
        </CardHeader>
        <CardContent>
          <NoData 
            message="No decklists available" 
            suggestion="Check back later for tournament results" 
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm transition-shadow duration-200 hover:shadow-md">
      <CardHeader>
        <CardTitle>Recent Top-Performing Decklists</CardTitle>
        <CardDescription>Most successful decklists in recent tournaments</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={data} enableRowSelection={false} enableViewOptions={false} />
      </CardContent>
    </Card>
  );
} 