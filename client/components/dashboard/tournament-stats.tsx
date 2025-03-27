"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

interface Tournament {
  name: string;
  processed_at: string;
  stats?: {
    entries: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    inclusionRate: number;
    winRateDiff: number;
  } | null;
}

const columns: ColumnDef<Tournament>[] = [
  {
    accessorKey: "name",
    header: "Tournament Name",
  },
  {
    accessorKey: "processed_at",
    header: "Processed Date",
    cell: ({ row }) => {
      return format(
        new Date(row.getValue("processed_at") as string),
        "MMM d, yyyy"
      );
    },
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const processedAt = new Date(row.getValue("processed_at") as string);
      const isNew = Date.now() - processedAt.getTime() < 24 * 60 * 60 * 1000;
      
      return isNew ? (
        <Badge className="bg-indigo-500">NEW</Badge>
      ) : null;
    },
  },
];

interface TournamentStatsProps {
  tournaments: Tournament[];
}

export function TournamentStats({ tournaments }: TournamentStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recently Imported Tournaments</CardTitle>
        <CardDescription>Latest tournament data included in deck analyses</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable 
          columns={columns} 
          data={tournaments || []}
          enablePagination={false}
          enableFiltering={false} 
        />
      </CardContent>
    </Card>
  );
} 