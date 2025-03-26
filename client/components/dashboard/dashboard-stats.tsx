"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { BarChart3 } from "lucide-react";
import type { Analysis } from "@/lib/types/dashboard";
import Link from "next/link";

const columns: ColumnDef<Analysis>[] = [
  {
    accessorKey: "deck_name",
    header: "Deck Name",
    cell: ({ row }) => {
      const deckName = row.getValue("deck_name") as string | null;
      const url = row.getValue("moxfield_url") as string;
      const deckId = url.split("/").pop();

      // Use deck_name if available, otherwise fall back to "Deck {deckId}"
      return (
        <Link
          href={`/deck/${deckId}`}
          className="text-blue-500 hover:text-blue-700 underline"
        >
          {deckName || `Deck ${deckId}`}
        </Link>
      );
    },
  },
  {
    accessorKey: "moxfield_url",
    header: "Moxfield",
    cell: ({ row }) => {
      const url = row.getValue("moxfield_url") as string;
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-700 underline"
        >
          View Deck
        </a>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Analyzed",
    cell: ({ row }) => {
      return formatDistanceToNow(
        new Date(row.getValue("created_at") as string),
        {
          addSuffix: true,
        }
      );
    },
  },
  {
    id: "winRate",
    header: "Commander Win Rate",
    cell: ({ row }) => {
      const commander = row.original.commanders;
      const total = commander.wins + commander.losses;
      const winRate =
        total > 0 ? Math.round((commander.wins / total) * 100) : 0;
      return `${winRate}%`;
    },
  },
];

interface DashboardStatsProps {
  analyses: Analysis[];
}

export function DashboardStats({ analyses }: DashboardStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Analyses</CardTitle>
        <CardDescription>Your most recent deck analyses</CardDescription>
      </CardHeader>
      <CardContent>
        <DataTable
          columns={columns}
          data={analyses || []}
          enablePagination={false}
          enableFiltering={false}
        />
      </CardContent>
    </Card>
  );
}
