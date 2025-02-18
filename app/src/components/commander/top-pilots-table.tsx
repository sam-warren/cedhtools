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
      <Link href={`/players/${row.original.id}`} className="hover:underline">
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

export function TopPilotsTable({ data }: TopPilotsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Pilots</CardTitle>
        <CardDescription>Players with the most success using this commander</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={data}
          enableSorting={true}
          enableFiltering={true}
          enablePagination={true}
          defaultPageSize={10}
          pageSizeOptions={[5, 10, 15, 20]}
          globalFilter={true}
        />
      </CardContent>
    </Card>
  );
} 