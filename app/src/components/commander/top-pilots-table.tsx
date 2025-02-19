"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import Link from "next/link";

export interface TopPilot {
  id: string;
  name: string;
  games: number;
  wins: number;
  winRate: number;
  top4s: number;
}

interface TopPilotsTableProps {
  data: TopPilot[];
}

const columns = [
  {
    accessorKey: "name",
    header: "Player",
    cell: ({ row }: { row: { original: TopPilot; getValue: (key: string) => string } }) => (
      <Link href={`/players/${row.original.id}`} className="hover:underline text-zinc-900 dark:text-zinc-100">
        {row.getValue("name")}
      </Link>
    )
  },
  {
    accessorKey: "games",
    header: "Entries",
    cell: ({ row }: { row: { getValue: (key: string) => number } }) => (
      <span className="text-zinc-600 dark:text-zinc-300">{row.getValue("games")}</span>
    )
  },
  {
    accessorKey: "winRate",
    header: "Win Rate",
    cell: ({ row }: { row: { getValue: (key: string) => number } }) => (
      <span className="text-zinc-600 dark:text-zinc-300">{row.getValue("winRate").toFixed(1)}%</span>
    )
  },
  {
    accessorKey: "top4s",
    header: "Tournament Wins",
    cell: ({ row }: { row: { getValue: (key: string) => number } }) => (
      <span className="text-zinc-600 dark:text-zinc-300">{row.getValue("top4s")}</span>
    )
  }
];

export function TopPilotsTable({ data }: TopPilotsTableProps) {
  // Take only top 5 pilots
  const topPilots = data.slice(0, 5);
  
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 h-full flex flex-col w-full">
      <CardHeader className="flex-none">
        <CardTitle className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">Top Pilots</CardTitle>
        <CardDescription className="text-zinc-500 dark:text-zinc-400">
          Players with the most success using this commander
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <DataTable
          columns={columns}
          data={topPilots}
          enableSorting={false}
          enableFiltering={false}
          enablePagination={false}
          enableColumnVisibility={false}
          globalFilter={false}
        />
      </CardContent>
    </Card>
  );
} 